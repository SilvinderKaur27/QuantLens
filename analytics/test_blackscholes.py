import math
import pytest

from blackscholes import (
    black_scholes_call,
    black_scholes_put,
    delta,
    norm_cdf,
    theta
)
args = {
    "S": 100.0,
    "K": 100.0,
    "T": 0.25,
    "r": 0.05,
    "sigma": 0.20
}

def test_normal_cdf_at_zero():
    assert norm_cdf(0) == pytest.approx(0.5)

def test_call_matches_hand_example():
    assert black_scholes_call(**args) == pytest.approx(4.615, abs=0.01)

def test_put_matches_hand_example():
    assert black_scholes_put(**args) == pytest.approx(3.373, abs=0.01)

def test_one_year_textbook_example():
    inputs = {**args, "T": 1.0}
    assert black_scholes_call(**inputs) == pytest.approx(10.4506, abs=0.001)
    assert black_scholes_put(**inputs) == pytest.approx(5.5735, abs=0.001)

def test_put_call_parity():
    call = black_scholes_call(**args)
    put = black_scholes_put(**args)
    right_side = (
        args["S"] - args["K"] * math.exp(-args["r"] * args["T"])
    )

    assert call - put == pytest.approx(right_side, abs=1e-9)

def test_call_and_put_delta():
    call_delta = delta(**args, option_type="call")
    put_delta = delta(**args, option_type="put")

    assert call_delta == pytest.approx(0.5695, abs=0.001)
    assert put_delta == pytest.approx(call_delta - 1.0)

def test_theta_is_negative_for_example():
    assert theta(**args, option_type="call") < 0
    assert theta(**args, option_type="put") < 0

@pytest.mark.parametrize(
    "overrides",
    [
        {"S": 0},
        {"K": -1},
        {"T": 0},
        {"sigma": 0},
        {"S": float("nan")}
    ]
)
def test_invalid_inputs_are_rejected(overrides):
    inputs = {**args, **overrides}
    with pytest.raises(ValueError):
        black_scholes_call(**inputs)

def test_invalid_option_type_is_rejected():
    with pytest.raises(ValueError):
        delta(**args, option_type="stock")