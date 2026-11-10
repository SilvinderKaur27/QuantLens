from math import erf, exp, isfinite, log, pi, sqrt

def norm_cdf(x: float) -> float:
    return 0.5 * (1.0 + erf(x/ sqrt(2.0)))

def norm_pdf(x: float) -> float:
    return (1/ sqrt(2.0 * pi)) * exp(-x*x/ 2.0)

def _validate_inputs(S, K, T, r, sigma):
    values = {
        "S": S,
        "K": K,
        "T": T,
        "r": r,
        "sigma": sigma,
    }

    for name, value in values.items():
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{name} must be a number.")
        if not isfinite(value):
            raise ValueError(f"{name} must be finite.")

    if S <= 0:
        raise ValueError("S must be positive.")
    if K <= 0:
        raise ValueError("K must be positive.")
    if T <= 0:
        raise ValueError("T must be positive.")
    if sigma <= 0:
        raise ValueError("sigma must be positive.")

def _d1_d2(S, K, T, r, sigma):
    _validate_inputs(S, K, T, r, sigma)
    d1 = (log(S/ K) + (r + 0.5 * sigma ** 2) * T)/ (sigma * sqrt(T))
    d2 = d1 - sigma * sqrt(T)
    return d1, d2

def black_scholes_call(S, K, T, r, sigma) -> float:
    d1, d2 = _d1_d2(S, K, T, r, sigma)
    discounted_strike = K * exp(-r * T)

    return (
        S * norm_cdf(d1)
        - discounted_strike * norm_cdf(d2)
    )

def black_scholes_put(S, K, T, r, sigma) -> float:
    d1, d2 = _d1_d2(S, K, T, r, sigma)
    discounted_strike = K * exp(-r * T)

    return (
        discounted_strike * norm_cdf(-d2)
        - S * norm_cdf(-d1)
    )

def delta(S, K, T, r, sigma, option_type = "call") -> float:
    if option_type not in ("call", "put"):
        raise ValueError("option_type must be 'call' or 'put'.")
    d1, _ = _d1_d2(S, K, T, r, sigma)

    if option_type == "call":
        return norm_cdf(d1)
    return norm_cdf(d1) - 1

def theta(S, K, T, r, sigma, option_type = "call") -> float:
    if option_type not in ("call", "put"):
        raise ValueError("option_type must be 'call' or 'put'.")

    d1, d2 = _d1_d2(S, K, T, r, sigma)
    decay = (
        -S * norm_pdf(d1) * sigma/ (2.0 * sqrt(T))
    )
    discounted_strike = K * exp(-r * T)

    if option_type == "call":
        theta_per_year = (
            decay - r * discounted_strike * norm_cdf(d2)
        )
    else:
        theta_per_year = (
            decay + r * discounted_strike * norm_cdf(-d2)
        )

    return theta_per_year/ 365.0

if __name__ == "__main__":
    inputs = {
        "S": 100.0,
        "K": 100.0,
        "T": 0.25,
        "r": 0.05,
        "sigma": 0.20,
    }

    d1, d2 = _d1_d2(**inputs)
    print(f"d1: {d1:.6f}")
    print(f"d2: {d2:.6f}")
    print(f"N(d1): {norm_cdf(d1):.6f}")
    print(f"N(d2): {norm_cdf(d2):.6f}")

    print(f"Call price: {black_scholes_call(**inputs):.6f}")
    print(f"Put price:  {black_scholes_put(**inputs):.6f}")

    print(f"Call Delta: {delta(**inputs, option_type='call'):.6f}")
    print(f"Put Delta:  {delta(**inputs, option_type='put'):.6f}")

    print(f"Call Theta/day: {theta(**inputs, option_type='call'):.8f}")
    print(f"Put Theta/day:  {theta(**inputs, option_type='put'):.8f}")