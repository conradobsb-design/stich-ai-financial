"""
Extrato Co. — Prophet Predictive Service
Microserviço FastAPI que recebe série histórica de despesas/receitas
e retorna projeções de curto, médio e longo prazo via Meta Prophet.
"""

import warnings
import logging
from typing import List, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prophet import Prophet
from pydantic import BaseModel

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Extrato Co. — Prophet Predictive Service",
    version="1.0.0",
    description="Projeções financeiras via Meta Prophet com sazonalidade e feriados BR.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # restringir ao domínio em produção via env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────

class DataPoint(BaseModel):
    ds: str   # "YYYY-MM-DD" (primeiro dia do mês)
    y: float  # valor agregado do mês

class PredictRequest(BaseModel):
    expense_series: List[DataPoint]
    income_series:  List[DataPoint]
    horizon: Optional[int] = 12      # meses à frente

class PeriodForecast(BaseModel):
    label:  str
    base:   float   # yhat   — P50
    low:    float   # yhat_lower — P10
    high:   float   # yhat_upper — P90

class PredictResponse(BaseModel):
    expense: dict            # short / medium / long para despesas
    income:  dict            # short / medium / long para receitas
    balance: dict            # short / medium / long para saldo (income - expense)
    months_used:       int
    seasonality_mode:  str
    has_yearly:        bool
    has_holidays:      bool
    status:            str

# ── Helpers ───────────────────────────────────────────────────────────────────

def safe(v: float) -> float:
    """Garante valor >= 0 arredondado em 2 casas."""
    return round(max(0.0, float(v)), 2)

def fmt_month(ts: pd.Timestamp) -> str:
    months_pt = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]
    return f"{months_pt[ts.month - 1]} {ts.year}"

def run_prophet(
    series: List[DataPoint],
    horizon: int,
    seasonality_mode: str,
    use_yearly: bool,
    use_holidays: bool,
    allow_negative: bool = False,
) -> pd.DataFrame:
    """
    Ajusta Prophet e retorna DataFrame com colunas:
    ds, yhat, yhat_lower, yhat_upper — apenas meses futuros.
    """
    df = pd.DataFrame([{"ds": p.ds, "y": p.y} for p in series])
    df["ds"] = pd.to_datetime(df["ds"])
    df = df.sort_values("ds").reset_index(drop=True)

    model = Prophet(
        seasonality_mode=seasonality_mode,
        changepoint_prior_scale=0.05,   # conservador — evita overfit com poucos dados
        seasonality_prior_scale=10.0,
        interval_width=0.80,            # intervalo 80%: P10 → P90
        yearly_seasonality=use_yearly,
        weekly_seasonality=False,       # série mensal — sem padrão semanal
        daily_seasonality=False,
    )

    if use_holidays:
        model.add_country_holidays(country_name="BR")

    model.fit(df)

    future   = model.make_future_dataframe(periods=horizon, freq="MS")
    forecast = model.predict(future)

    last_date = df["ds"].max()
    future_fc = forecast[forecast["ds"] > last_date].reset_index(drop=True)

    if not allow_negative:
        future_fc["yhat"]       = future_fc["yhat"].clip(lower=0)
        future_fc["yhat_lower"] = future_fc["yhat_lower"].clip(lower=0)
        future_fc["yhat_upper"] = future_fc["yhat_upper"].clip(lower=0)

    return future_fc

def build_horizons(fc: pd.DataFrame) -> dict:
    """
    Retorna dict com short / medium / long a partir do DataFrame de projeção.
    """
    n = len(fc)

    # Curto prazo: próximo mês
    s = fc.iloc[0]
    short = PeriodForecast(
        label=fmt_month(s["ds"]),
        base=safe(s["yhat"]),
        low=safe(s["yhat_lower"]),
        high=safe(s["yhat_upper"]),
    )

    # Médio prazo: meses 2-4 (soma trimestral)
    med_slice = fc.iloc[1:4] if n >= 4 else fc.iloc[1:]
    if len(med_slice) > 0:
        m_start = fmt_month(med_slice.iloc[0]["ds"]).split()[0]
        m_end   = fmt_month(med_slice.iloc[-1]["ds"])
        medium  = PeriodForecast(
            label=f"{m_start}–{m_end}",
            base=safe(med_slice["yhat"].sum()),
            low=safe(med_slice["yhat_lower"].sum()),
            high=safe(med_slice["yhat_upper"].sum()),
        )
    else:
        medium = short

    # Longo prazo: 12 meses completos (soma)
    long = PeriodForecast(
        label="12 meses",
        base=safe(fc["yhat"].sum()),
        low=safe(fc["yhat_lower"].sum()),
        high=safe(fc["yhat_upper"].sum()),
    )

    return {
        "short":  short.model_dump(),
        "medium": medium.model_dump(),
        "long":   long.model_dump(),
    }

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "prophet-predictive", "version": "1.0.0"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    n_exp = len(req.expense_series)
    n_inc = len(req.income_series)

    if n_exp < 3:
        raise HTTPException(
            status_code=422,
            detail=f"Dados insuficientes: {n_exp} meses de despesa. Mínimo: 3.",
        )

    n = min(n_exp, n_inc) if n_inc >= 3 else n_exp

    # Configuração adaptativa conforme volume de histórico
    use_yearly   = n >= 12
    use_holidays = n >= 6
    seasonality_mode = "multiplicative" if n >= 6 else "additive"

    logger.info(f"Prophet fit: {n} meses | mode={seasonality_mode} | yearly={use_yearly} | holidays={use_holidays}")

    try:
        # Projeção de despesas
        fc_expense = run_prophet(
            req.expense_series, req.horizon,
            seasonality_mode, use_yearly, use_holidays,
            allow_negative=False,
        )

        # Projeção de receitas (se disponível)
        if n_inc >= 3:
            fc_income = run_prophet(
                req.income_series, req.horizon,
                seasonality_mode, use_yearly, use_holidays,
                allow_negative=False,
            )
        else:
            # Replica a última renda conhecida como constante
            last_income = req.income_series[-1].y if req.income_series else 0
            fc_income = fc_expense.copy()
            fc_income["yhat"]       = last_income
            fc_income["yhat_lower"] = last_income * 0.9
            fc_income["yhat_upper"] = last_income * 1.1

        # Saldo = receita - despesa (pode ser negativo)
        fc_balance = fc_expense.copy()
        fc_balance["yhat"]       = fc_income["yhat"]       - fc_expense["yhat"]
        fc_balance["yhat_lower"] = fc_income["yhat_lower"] - fc_expense["yhat_upper"]  # pior caso
        fc_balance["yhat_upper"] = fc_income["yhat_upper"] - fc_expense["yhat_lower"]  # melhor caso

        return PredictResponse(
            expense=build_horizons(fc_expense),
            income=build_horizons(fc_income),
            balance=build_horizons(fc_balance),
            months_used=n,
            seasonality_mode=seasonality_mode,
            has_yearly=use_yearly,
            has_holidays=use_holidays,
            status="ok",
        )

    except Exception as e:
        logger.error(f"Prophet error: {e}")
        raise HTTPException(status_code=500, detail=f"Erro no modelo Prophet: {str(e)}")
