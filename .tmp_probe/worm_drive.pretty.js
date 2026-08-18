(function(_0x2016ca, _0x408a7f) {
    var _0x13a249 = _0x55de,
        _0x5383d4 = _0x2016ca();
    while (!![]) {
        try {
            var _0x15e289 = parseInt("59702igfhcv") / 0x1 + -parseInt("50276OCXUjL") / 0x2 * (-parseInt("6Mxqufj") / 0x3) + parseInt("56776yWOHVA") / 0x4 + parseInt("2215APvmqA") / 0x5 * (parseInt("3198zcGTjR") / 0x6) + parseInt("159481xwnWKE") / 0x7 * (-parseInt("104KhwKoZ") / 0x8) + -parseInt("1706553UqITlG") / 0x9 + -parseInt("2935630ASJxaB") / 0xa * (-parseInt("11jSuHXX") / 0xb);
            if (_0x15e289 === _0x408a7f) break;
            else _0x5383d4['push'](_0x5383d4['shift']());
        } catch (_0x3cf01b) {
            _0x5383d4['push'](_0x5383d4['shift']());
        }
    }
}(_0x4c86, 0x2907a));

function checkPower() {
    var _0x5855ff = _0x55de,
        _0x5dbee6 = {
            'fYMlM': function(_0x14cb25, _0x313196) {
                return _0x14cb25(_0x313196);
            },
            'KsCpf': function(_0x2d5898, _0x10f5eb) {
                return _0x2d5898 > _0x10f5eb;
            },
            'AOeEe': function(_0x53f18c, _0xf7f3bc) {
                return _0x53f18c(_0xf7f3bc);
            },
            'WyWHH': function(_0x1676a6, _0x5af0ae) {
                return _0x1676a6(_0x5af0ae);
            },
            'OOyGU': function(_0x229016, _0x11dd43) {
                return _0x229016(_0x11dd43);
            }
        },
        _0x12eb60 = _0x5dbee6["fYMlM"]($, '#power')["val"](),
        _0x481524 = /^[0-9]{1,4}[.]{0,1}[0-9]{0,6}$/ ["test"](_0x12eb60) && _0x12eb60 <= 0x3e8 && _0x5dbee6["KsCpf"](_0x12eb60, 0x0);
    return _0x481524 ? ($('#power')["css"]('border', ''), _0x5dbee6["AOeEe"]($, '#errorInfo1')["html"]('')) : (_0x5dbee6["WyWHH"]($, '#power')["css"]('border', '1px solid red'), _0x5dbee6["OOyGU"]($, '#errorInfo1')["html"]('请输入0-1000之间的数')), _0x481524;
}

function checkTorque() {
    var _0x1a7e89 = _0x55de,
        _0x4b53eb = {
            'cnPvN': function(_0x1f57d1, _0x5cbf03) {
                return _0x1f57d1 <= _0x5cbf03;
            },
            'LcKdu': function(_0x1e1116, _0x197816) {
                return _0x1e1116 > _0x197816;
            },
            'gPZjQ': function(_0x107de8, _0x1165d2) {
                return _0x107de8(_0x1165d2);
            },
            'LpWJX': function(_0x1b0699, _0x5680dd) {
                return _0x1b0699(_0x5680dd);
            }
        },
        _0x5437f5 = $('#torque')["val"](),
        _0x4ac986 = /^[0-9]{1,5}[.]{0,1}[0-9]{0,6}$/ ["test"](_0x5437f5) && _0x4b53eb["cnPvN"](_0x5437f5, 0x2710) && _0x4b53eb["LcKdu"](_0x5437f5, 0x0);
    return _0x4ac986 ? (_0x4b53eb["gPZjQ"]($, '#torque')["css"]('border', ''), $('#errorInfo1')["html"]('')) : ($('#torque')['css']('border', '1px solid red'), _0x4b53eb["LpWJX"]($, '#errorInfo1')["html"]('请输入0-10000之间的数')), _0x4ac986;
}

function checkN1() {
    var _0x162e4a = _0x55de,
        _0x1ac009 = {
            'MdTlU': function(_0x265667, _0x292c10) {
                return _0x265667 > _0x292c10;
            },
            'SbdeU': function(_0x35d37b, _0x158605) {
                return _0x35d37b(_0x158605);
            }
        },
        _0x30bc9d = $('#n1')["val"](),
        _0x2faf6f = /^[0-9]{1,4}[.]{0,1}[0-9]{0,6}$/ ["test"](_0x30bc9d) && _0x30bc9d <= 0x1388 && _0x1ac009["MdTlU"](_0x30bc9d, 0x0);
    return _0x2faf6f ? ($('#n1')["css"]('border', ''), _0x1ac009["SbdeU"]($, '#errorInfo1')['html']('')) : ($('#n1')["css"]('border', '1px solid red'), $('#errorInfo1')["html"]('请输入0-5000之间的数')), _0x2faf6f;
}

function checkN2() {
    var _0x44805e = _0x55de,
        _0x3a528c = {
            'sfhNk': function(_0x12df1f, _0x44fd18) {
                return _0x12df1f(_0x44fd18);
            },
            'mvoVm': function(_0x1cd986, _0x187f40) {
                return _0x1cd986 <= _0x187f40;
            },
            'WjNxY': function(_0x22d69c, _0x592980) {
                return _0x22d69c(_0x592980);
            }
        },
        _0x348730 = _0x3a528c["sfhNk"]($, '#n2')["val"](),
        _0x1dd22b = /^[0-9]{1,4}[.]{0,1}[0-9]{0,6}$/ ["test"](_0x348730) && _0x3a528c["mvoVm"](_0x348730, 0x1388) && _0x348730 > 0x0;
    return _0x1dd22b ? ($('#n2')["css"]('border', ''), _0x3a528c["WjNxY"]($, '#errorInfo1')['html']('')) : ($('#n2')["css"]('border', '1px solid red'), _0x3a528c["WjNxY"]($, '#errorInfo1')["html"]('请输入0-5000之间的数')), _0x1dd22b;
}

function _0x4c86() {
    var _0x53199e = ['WQiHrCkhjG', 'WOZdNqBdKmoB', 'WOlcJ1RcNZa', 'WQCeemo0ACkIW74', 'ASo8W5LBW44', 'WO/dNtu', 'WQVdS1eQ', 'ySoMWQNdImkl', 'qCk1W5usbq', 'xmkQW7Kfbq', 'WQVcQmoO', 'aLSwW7yA', 'yCkwW4y0oW', 'W5RdT8oiW74j', 'pCo3d8o2WOZdICoCWOW', 'dCk2if1w', 'fZTUW4q', 'WOBcGum', 'g0OgW78Z', 'eCoTWPK8oW', 'WPBcUwlcNrK', 'BCo8tG', 'rIj1W5DSWQLBWPNcOqy', 'WQvvh8odF8o+kSoA', 'a0mFW5y+', 'W5/cJIX2bqvmya', 'lrrvAW', 'W5vEg8odWOe', 'W64XWPD5', 'lmkcluDL', 'W5GhACkNW54', 'WOJdLIvmfsn3qq', 'nfhcU8kPgq', 'WOtcHvZcHq', 'sLNcV8oQfCkisGNcNvS', 'lcFdVSkdlG', 'A8o1s8oN', 'A8oKW44', 'mmoLWP8Jlq', 'a3iG', 'WQVdKSkv', 'DCo2WQ/dMG', 'W4ZdO8oQlwGhcJjnobi', 'mCk3cNK', 'vvddRfZdHa', 'gSkOtSkpfq', 'oLSPW6W', 'kSo0WQ49gG', 'W6S2AmktW4u', 'E3nVWRNcOW', 'WQPkWO7cSci', 'WPSEeKtcKa', 'cCkcn0Xa', 'WQyDcMRcLG', 'oavsBq', 'sfpcOCkACW', 'WQfraa', 'WRiJemoyvG', 'ACoOCmoHrW', 'WPNdMIXmfW', 'wCorW4ldQa', 'WPZdMJvqhdLqwq', 'umkPW5m', 'sqj7W5NdGrddIq', 'WR7dPveRgmkasrm', 'WQRcKmoXWRHk', 'FCoXq8ow', 'WQ9LW6aFnG', 'lXns', 'DSonjG', 'WRect8kcja', 'swRcQCkwwa', 'W4NdMSo9W44IzmoVtW', 'x3dcVa', 'WQeojCoOFCkZW57cTW', 'txFdNSo9W6e', 'WOFdQq5OgW', 'WQr7W6BcOcu0W6u', 'yCorj8kJghxcHG', 'W7mEn8k6', 'W78EW6u3', 'BCk5WOVdVa', 'F3VcLCkKta', 'W6jBaXnp', 'WP3dNcpdImoX', 'WR3dKs7dP8oC', 'W64vxq', 'W6bIhq', 'wfVdHe3dISoX', 'WRaEi8o7Aq', 'W5tdImkPWONcT27dJmkf', 'fCkpB8kIfG', 'tMBcVmkfC1tdV2G', 'oCkGWO06WP51W4RdOmkHhs8sma', 'w8ovW50', 'W7ShqG', 'WQq3zSkDgCk0WOddMq', 'x8oBW4tdSIq', 'FCoYumoswJn4', 'W5a0aMlcRSoUWR5y', 'vu/dTG', 'WQJdRh0', 'WPhcUCo8WPDq', 'WQddLCklEW', 'kGRdOSk3oG', 'q8o4WR3dVmkl', 'sWD6', 'WOKnlN7cKa', 'tCoqW7zNW5e', 'WQz1W4W', 'WRyNwvW2WO3cG8oMimkKWPS', 'WOJdVgWMla', 'W7aVba', 'fCoJWOa', 'khxcISkU', 'E27dN1ldNW', 'W5OvsmklW4u', 'WPJcLelcNq', 'WOpdLIHMhYj4uq', 'W6DIiCkJhCk3WO/dL8o5', 'WPCkcW', 'WR4XwCkJiW', 'sMlcOW', 'cZL7srm', 'qLpdG1BdL8o1vG', 'pmo8nmoBWPG', 'WPZdTK4', 'uSk4W5m', 'W4ClW64cW4G', 'W6TTgCozWOK', 'W4ZdQ8k2', 'WPhcRSkWCq', 'WRXwgSkVW4FdGCoMWOXH', 'rCk7W4W', 'f8oNWP8M', 'WOKFcMO', 'WO50jmotvq', 'd8k+Eq', 'k8kSeNTI', 'wCkmwbK', 'umoQwmo0AG', 'neKI', 'WPNcTgxcNrO', 'WR9eaCoA', 'W6ZdUmoUWOvrDhvX', 'C8o2WR0', 'z8oBjSkNawtdSaO', 'WOBdIYTj', 'W5qWhq', 'WR9KW7NcSdK', 'WQvFgCoyDW', 'vgpdUmoaW6C', 'erZdQ8k+', 'hwCHWOm', 'uSkqvbVdRmoO', 'umooW6rRW4G', 'WRBdVu8', 'vcrhiW', 'ghuPW5ah', 'f37cK8kdoG', 'D8oib8kXaG', 'W6TLaWC', 'AmkPWPu', 'zmovW61jW4i', 'WRSFo8oX', 'WQvRWOdcHa', 'r8kzwq', 'DSk8WPtdPa', 'zuFcH8kvwq', 'WPRcJCkBzcW', 'WRj+WO0', 'WRBdUwFdMaS', 'qZjh', 'WQvxWQFcRZW', 'D8oYWRa', 'WPFdKvBdId0', 'r8oMW4XbW6i', 'W6hdVCkbWQ7cTW', 'WQNdT04', 'hv/cNmkFfG', 'CwXMWOi', 'WQJdQe7dRq', 'WOFdHZVdIG', 'vLDYWQNcKW', 'WQRdOLFdO8oyW7Kh', 'FSo2W5e', 'gGddP8k8cmko', 'p2pcIG', 'q8o4W5DIW7e', 'lNxcISkVh8oqawa', 'WRBdPH9ceW', 'bI5MtWG', 'C8oPt8oD', 'W6inw8k6', 'W5CMh3FcOSkzWQi', 'rgBdI0FdHq', 'BmoIW4tdIsG', 'WQukoG', 'W64tw8kcW5C', 'W6G/WOG', 'WPzJW70HmG', 'zbH4eCoB', 'DKpdOa', 'A8kUWOJdJg0', 'B3LN', 'WPFdGaBdKCob', 'E8k2CIpdMa', 'W5RdJmo9W44JDCoUsa', 'kNhcLq', 'WRRdJSktEse', 'WQvRWPxcMa', 'W7yQWOLH', 'k8kMfgbQWPldTXO', 'l8oYWPqtkW', 'WPxdV1NdGSol', 'WONdPfe', 'F8o4W5FdLbO', 'WRlcQmkvvte', 'WQ3dMGnhjq', 'v0/dTKRdGSo1DZG', 'x8orW4ldQsZcS8kWW70', 'WQjwhCoYzW', 'WR7dGmkk', 'WRldLSkjtHa', 'WQn6W6JcKsu', 'W7qEnghcGW', 'W74wrmkNug86', 'WRZdJSkGFJ3dH34', 'vhFcOSkC', 'W6qHW7mqW54', 'l8kIcW', 'WOFdJcHHaW', 'WOJdJ3GmmG', 'C8okW5ruW4a', 'dczKW4xdLtddOSkn', 'cSkKACk/eIFcJ1S', 'gSkSzG', 'omk3e2C', 'W7vWaG', 'jxSLW4qX', 'WPhcQSopWRjr', 'WRz6WPlcNXFcVKNcUa', 'WPVdU3G5nG', 'qvL6WOlcJa', 'WQjXW5pcVdeLW4xcKa', 'oGfn', 'W5aGkwpcLG', 'W6Pjimo/', 'sCkIWRFdSea', 'h2dcK8kGha', 'y8oFoq', 'W5pdI8oJW5C', 'qmoAWR/dImkC', 'W4LChcHd', 'W43dNSoI', 'WOZcM8kxtZK', 'i8o3eSoKWPtdLq', 'D8kCWRpdPfC', 'CCkbWPddMxG', 'W65Nat1T', 'A21zWR7cVG', 'z8oNW6r1W48', 'WP0GxCkGhG', 'gIbOW5NdSq', 'W7OikhdcOq', 'kh/cVmkIa8olk2q', 'W6Kkrq', 'nCkSehrKWORdLG', 'W6OZW5agW7S', 'WQnYW4JcHZy', 'WP/dSvnMgW', 'wCoBW7FdTtJcOSkq', 'WOfYW4C', 'e38TWOG', 'WQBdS1hdOGZcPSkk', 'WPq5Dmk6dq', 'ACo4uCoeuXmnka', 'CCoin8kApG', 'e2iPWRHu', 'WQXRWOZcHG', 'ASonW4TgW7i', 'BSkNWO4', 'FmoqmmkGgxNdLq', 'AKxdGComW5K', 'W6ldM8oeW6Gi', 'cCoLWQeQeq', 'c8o2WOe+', 'qf3dQq', 'WOiyfa', 'W7WywG', 'y8o4WRJdUCkw', 'WPJdNIO', 'WOVcTCkOCZ4', 'W7f+gWvK', 'iHriEdC', 'ivS9', 'xKJdQfm', 'hdXW', 'r8oClCktja', 'W7SFx8kHsG', 'W7SXWO98WOW', 'BLtcTCkvzq', 'kc0YW5RdVL89W4O3aSkvFW', 'WQjHW7lcMsu', 'W6v9dWW', 'WPb0W6yJgW', 'iCoPWO0ajW', 'W47dUSk2', 'kSocpCoTWRy', 'WRnNW5m', 'cSovn8oOWPO', 'A1RcLCkIwa', 'oCoZea', 'cs5V', 'j8omWOOIbq', 'omk3bNS', 'zwRcHSkvsa', 'mv0QWP9m', 'tMZcUSkEEW', 'a8okbeddISoDymoBWQ7dOW', 'vSk8W4yvaSkPWOWC', 'W5VdQmkP', 'vIby', 'ySoNimk8aW', 'WRNcJ8k1', 'WP1rWPBcNZy', 'WPbUW4eDbW', 'qmkVW4ipfCkYWOaC', 'WQaZEq', 'A3RdTCoMW5O', 'WOZdGcu', 'WOHuW6q5mq', 'd8kLA8k4ecW', 'WOpcHKJcLti', 'WQ/dUveQ', 'WQLYW7Cdbq', 'WQ4tbgxcSa', 'W7SuW6u3', 'WRxcR8onWQ5J', 'W6Wvv8kX', 'qSoYW6i', 'rmkwW5igdG', 'WPrGW5G', 'cW3dTCkNa8kFstW', 'bSoQWPjlv8kpWQOQW4pdJmoG', 'WORcLvRcSXm', 'WO3dLYDlfYG', 'b3W5WOfY', 'W6HnpW', 'W6JdV8kZW6esrxPMAmoCW7K', 'cJzaW6tdTq', 'W70AW7O', 'WPJdSLfxaW4diG', 'W6mpW7SV', 'CuRdQfpdRG', 'W40Hkg7cPG', 'lSoxWR4Bkq', 'dtBdTSoejXhdG37cILpcRYK', 'p3JcMmk0fmob', 'kCkKeCkecvr5ceJcIL3cHCka', 'W5a+bhNcPG', 'r1RdReJdGa', 'DuNdIeNdIG', 'geiYW5ym', 'nHDoqa4', 'WQldJZ5Kba', 'axW+WP5JWQ8U', 'W4a0DmkjW58', 'baxcTGRcMCkJaH8FDSkICmkq', 'uSk4WOhdIw0', 'WPVdMtDHba', 'W4RdMCoNW4WH', 'WRiFiSoV', 'y8oyW7pdQre', 'F3rQWOK', 'WOVcSCoiWOvD', 'WR7cUSo3', 'W7zypSoN', 'dWNdQG', 'wg/dG2/dOq', 'WOaAESkUoW', 'ffSkWQPr', 'WOdcJ1ZcHq', 'nd1lW6ddNW', 'vKBcVCkIDW', 'WPNdKJO', 'aCkQWRK0WRO7DmkhWP1jW7C', 'WP19hSo1ua', 'nr3dVSkFoa', 'W4LvbmodWQi', 'yLtdNSoxW7G', 'v8oGW70', 'Emo1q8oFwai'];
    _0x4c86 = function() {
        return _0x53199e;
    };
    return _0x4c86();
}

function checkTransmissionRatio() {
    var _0x4e1a7a = _0x55de,
        _0x5e9e1f = {
            'XAqlJ': function(_0x30f1a1, _0x45fe82) {
                return _0x30f1a1 <= _0x45fe82;
            },
            'VOEvA': function(_0x4ef445, _0x5abe46) {
                return _0x4ef445(_0x5abe46);
            },
            'CeEbU': function(_0x220fcc, _0x55a056) {
                return _0x220fcc(_0x55a056);
            }
        },
        _0xd95638 = $('#transmissionRatio')["val"](),
        _0x3cd275 = /^[0-9]{1,2}[.]{0,1}[0-9]{0,6}$/ ["test"](_0xd95638) && _0x5e9e1f["XAqlJ"](_0xd95638, 0x53) && _0xd95638 > 0x4;
    return _0x3cd275 ? ($('#transmissionRatio')['css']('border', ''), _0x5e9e1f["VOEvA"]($, '#errorInfo1')["html"]('')) : (_0x5e9e1f["CeEbU"]($, '#transmissionRatio')["css"]('border', '1px solid red'), $('#errorInfo1')["html"]('请输入4-83之间的数')), _0x3cd275;
}

function checkAssumeZ1() {
    var _0x529111 = _0x55de,
        _0x2d93f7 = {
            'NlBuQ': function(_0x16fb78, _0x445100) {
                return _0x16fb78 <= _0x445100;
            },
            'nUoZY': function(_0x1a0639, _0x1e9f22) {
                return _0x1a0639(_0x1e9f22);
            }
        },
        _0x58dba6 = $('#assumeZ1')["val"](),
        _0x5cb901 = /^[0-9]{1}$/ ['test'](_0x58dba6) && _0x58dba6 >= 0x1 && _0x2d93f7["NlBuQ"](_0x58dba6, 0x6);
    return _0x5cb901 ? (_0x2d93f7["nUoZY"]($, '#assumeZ1')["css"]('border', ''), $('#errorInfo2')["html"]('')) : ($('#assumeZ1')["css"]('border', '1px solid red'), $('#errorInfo2')['html']('请输入1-6之间的数')), _0x5cb901;
}

function checkAssumeZ2() {
    var _0x1d75b7 = _0x55de,
        _0x191665 = {
            'TyNcU': function(_0x425878, _0x2e359c) {
                return _0x425878(_0x2e359c);
            },
            'oZeSb': function(_0x451a1b, _0x3f25e5) {
                return _0x451a1b >= _0x3f25e5;
            },
            'rAtqZ': function(_0x8472cd, _0x1a5cb3) {
                return _0x8472cd(_0x1a5cb3);
            },
            'LuxMW': function(_0x37c57c, _0x1857aa) {
                return _0x37c57c(_0x1857aa);
            }
        },
        _0x219b96 = _0x191665["TyNcU"]($, '#assumeZ2')["val"](),
        _0x3418d3 = /^[0-9]{1,2}$/ ["test"](_0x219b96) && _0x191665["oZeSb"](_0x219b96, 0x1d) && _0x219b96 <= 0x53;
    return _0x3418d3 ? (_0x191665['rAtqZ']($, '#assumeZ2')['css']('border', ''), $('#errorInfo2')["html"]('')) : (_0x191665["rAtqZ"]($, '#assumeZ2')["css"]('border', '1px solid red'), _0x191665["LuxMW"]($, '#errorInfo2')['html']('z2超出29-83的标准范围')), _0x3418d3;
}

function checkZ1() {
    var _0x3126b5 = _0x55de,
        _0x29b6bd = {
            'mxXMZ': function(_0x4d461e, _0x36c99e) {
                return _0x4d461e >= _0x36c99e;
            },
            'UOxQA': function(_0x25eca4, _0x7877ac) {
                return _0x25eca4(_0x7877ac);
            }
        },
        _0x677f4a = $('#z1')["val"](),
        _0x1256be = /^[0-9]{1}$/ ["test"](_0x677f4a) && _0x29b6bd['mxXMZ'](_0x677f4a, 0x1) && _0x677f4a <= 0x6;
    return _0x1256be ? (_0x29b6bd['UOxQA']($, '#z1')["css"]('border', ''), $('#errorInfo4')["html"]('')) : (_0x29b6bd["UOxQA"]($, '#z1')["css"]('border', '1px solid red'), $('#errorInfo4')["html"]('请输入1-6之间的数')), _0x1256be;
}

function checkZ2() {
    var _0x92e1fd = _0x55de,
        _0xdafe18 = {
            'tCwkQ': function(_0x819e1c, _0xdf0fb6) {
                return _0x819e1c >= _0xdf0fb6;
            },
            'mLBgQ': function(_0x31d9fc, _0x11a0c3) {
                return _0x31d9fc <= _0x11a0c3;
            },
            'YDHeF': function(_0x1e99fd, _0x5119fb) {
                return _0x1e99fd(_0x5119fb);
            },
            'rqXtT': function(_0x215f7a, _0x30718e) {
                return _0x215f7a(_0x30718e);
            }
        },
        _0x29928f = $('#z2')["val"](),
        _0x552aec = /^[0-9]{1,2}$/ ["test"](_0x29928f) && _0xdafe18['tCwkQ'](_0x29928f, 0x1d) && _0xdafe18['mLBgQ'](_0x29928f, 0x53);
    return _0x552aec ? (_0xdafe18["YDHeF"]($, '#z2')["css"]('border', ''), _0xdafe18["rqXtT"]($, '#errorInfo4')["html"]('')) : (_0xdafe18["YDHeF"]($, '#z2')['css']('border', '1px solid red'), $('#errorInfo4')["html"]('z2超出29-83的标准范围')), _0x552aec;
}

function checkM() {
    var _0xd635e5 = _0x55de,
        _0x1becb8 = {
            'tbIRQ': function(_0x1a5168, _0x18dbdd) {
                return _0x1a5168 <= _0x18dbdd;
            },
            'OOxel': function(_0x3f2382, _0x57d372) {
                return _0x3f2382(_0x57d372);
            }
        },
        _0x6405f5 = $('#m')['val'](),
        _0x2d9b30 = /^[0-9]{1,2}[.]{0,1}[0-9]{0,2}$/ ["test"](_0x6405f5) && _0x6405f5 >= 0x1 && _0x1becb8["tbIRQ"](_0x6405f5, 0x19);
    return _0x2d9b30 ? ($('#m')["css"]('border', ''), $('#errorInfo4')["html"]('')) : ($('#m')["css"]('border', '1px solid red'), _0x1becb8["OOxel"]($, '#errorInfo4')["html"]('m超出1-25的标准范围')), _0x2d9b30;
}

function checkCenterDisAFinal() {
    var _0x2c0cce = _0x55de,
        _0x4de40e = {
            'nSFPN': function(_0x5cc4bc, _0x5f46f7) {
                return _0x5cc4bc <= _0x5f46f7;
            },
            'LtDKo': function(_0x568600, _0x4449d4) {
                return _0x568600(_0x4449d4);
            },
            'rZNxj': function(_0x19955c, _0x54629f) {
                return _0x19955c(_0x54629f);
            }
        },
        _0x920cec = $('#centerDisAFinal')['val'](),
        _0x2d7234 = /^[0-9]{1,3}$/ ["test"](_0x920cec) && _0x920cec >= 0x28 && _0x4de40e["nSFPN"](_0x920cec, 0x1f4);
    return _0x2d7234 ? (_0x4de40e["LtDKo"]($, '#centerDisAFinal')["css"]('border', ''), $('#errorInfo3,#errorInfo4')["html"]('')) : (_0x4de40e["rZNxj"]($, '#centerDisAFinal')["css"]('border', '1px solid red'), $('#errorInfo3,#errorInfo4')['html']('中心距a超出40-500的标准范围')), _0x2d7234;
}

function checkD1() {
    var _0x3da59e = _0x55de,
        _0x56c905 = {
            'snHXx': function(_0x1bc6cf, _0x3f8309) {
                return _0x1bc6cf(_0x3f8309);
            }
        },
        _0x217484 = $('.d1')["val"](),
        _0x502891 = /^[0-9]{1,3}[.]{0,1}[0-9]{0,2}$/ ["test"](_0x217484) && _0x217484 >= 0x12 && _0x217484 <= 0xc8;
    return _0x502891 ? ($('.d1')["css"]('border', ''), $('#errorInfo3,#errorInfo4')["html"]('')) : (_0x56c905["snHXx"]($, '.d1')["css"]('border', '1px solid red'), _0x56c905["snHXx"]($, '#errorInfo3,#errorInfo4')["html"]('d1超出18-200的标准范围')), _0x502891;
}

function kCalculator() {
    var _0x48a20e = _0x55de,
        _0x100f62 = {
            'Wsfoj': function(_0x223c06, _0x492288) {
                return _0x223c06(_0x492288);
            },
            'tPnjl': function(_0xa69473, _0x1258b7) {
                return _0xa69473 !== _0x1258b7;
            },
            'VHoFN': function(_0x40db39, _0x215502) {
                return _0x40db39 * _0x215502;
            }
        },
        _0xe066ef = _0x100f62["Wsfoj"]($, '#kA')["val"](),
        _0x165435 = $('#kV')["val"](),
        _0x32fc29 = $('#kBeta')["val"]();
    if (_0x100f62["tPnjl"](0x0, (_0xe066ef && _0x165435 && _0x32fc29)["length"])) return Math["round"](_0x100f62["VHoFN"](_0xe066ef, _0x165435) * _0x32fc29 * 0x2710) / 0x2710;
}

function assumeEfficiencyAndTorque2Calculator(_0x21d188, _0xee2441, _0x7a000f) {
    var _0x42ebba = _0x55de,
        _0x2b2133 = {
            'wejig': function(_0x7ac559, _0xc58cdb) {
                return _0x7ac559 - _0xc58cdb;
            },
            'zwoYU': function(_0x454738, _0x5dc427) {
                return _0x454738 * _0x5dc427;
            },
            'jUPJR': function(_0x5bb293, _0x1de15b) {
                return _0x5bb293 / _0x1de15b;
            }
        };
    _0x7a000f = $('#torque')["val"]();
    var _0x1db27e = _0x2b2133["wejig"](0x64, _0x2b2133["zwoYU"](3.5, Math["sqrt"](_0x2b2133["jUPJR"](_0x21d188, _0xee2441)))) / 0x64,
        _0x4117a1 = _0x2b2133["zwoYU"](_0x21d188 / _0xee2441, _0x1db27e) * _0x7a000f;
    return {
        'assumeEfficiency': _0x1db27e = Math["round"](0x3e8 * _0x1db27e) / 0x3e8,
        'torque2': _0x4117a1 = Math["round"](0x3e8 * _0x4117a1) / 0x3e8
    };
}

function assumeZ1Query(_0x27d947) {
    var _0x83355f = _0x55de,
        _0x2cf4d2 = {
            'tsPoS': function(_0x53ab22, _0x513317) {
                return _0x53ab22 >= _0x513317;
            },
            'AIcfo': function(_0x87cfaa, _0x39f490) {
                return _0x87cfaa <= _0x39f490;
            },
            'uiffG': function(_0x1be5bd, _0x23d1b6) {
                return _0x1be5bd >= _0x23d1b6;
            },
            'wkYfy': function(_0x17537f, _0x255304) {
                return _0x17537f <= _0x255304;
            }
        };
    let _0x80b8f7;
    return _0x2cf4d2['tsPoS'](_0x27d947, 0x5) && _0x2cf4d2["AIcfo"](_0x27d947, 0x6) ? _0x80b8f7 = '6' : _0x27d947 >= 0x7 && _0x27d947 <= 0x8 ? _0x80b8f7 = '4' : _0x27d947 >= 0x9 && _0x27d947 <= 0xd ? _0x80b8f7 = '4,(3)' : _0x2cf4d2["tsPoS"](_0x27d947, 0xe) && _0x27d947 <= 0x18 ? _0x80b8f7 = '2,(4,3)' : _0x2cf4d2["uiffG"](_0x27d947, 0x19) && _0x27d947 <= 0x1b ? _0x80b8f7 = '2,(3)' : _0x27d947 >= 0x1c && _0x2cf4d2["wkYfy"](_0x27d947, 0x28) ? _0x80b8f7 = '1,(2)' : _0x27d947 > 0x28 && (_0x80b8f7 = '1'), _0x80b8f7;
}

function _0x55de(_0x3cdaad, _0x23f0f0) {
    _0x3cdaad = _0x3cdaad - 0x108;
    var _0x4c8687 = _0x4c86();
    var _0x55de40 = _0x4c8687[_0x3cdaad];
    if (_0x55de['mrOGMn'] === undefined) {
        var _0x322a3a = function(_0x238906) {
            var _0xa9821 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';
            var _0x139e8a = '',
                _0x2dfcb6 = '';
            for (var _0x149479 = 0x0, _0x3dc18e, _0x2215ad, _0x1ddf84 = 0x0; _0x2215ad = _0x238906['charAt'](_0x1ddf84++); ~_0x2215ad && (_0x3dc18e = _0x149479 % 0x4 ? _0x3dc18e * 0x40 + _0x2215ad : _0x2215ad, _0x149479++ % 0x4) ? _0x139e8a += String['fromCharCode'](0xff & _0x3dc18e >> (-0x2 * _0x149479 & 0x6)) : 0x0) {
                _0x2215ad = _0xa9821['indexOf'](_0x2215ad);
            }
            for (var _0x5749cf = 0x0, _0x43dc52 = _0x139e8a['length']; _0x5749cf < _0x43dc52; _0x5749cf++) {
                _0x2dfcb6 += '%' + ('00' + _0x139e8a['charCodeAt'](_0x5749cf)['toString'](0x10))['slice'](-0x2);
            }
            return decodeURIComponent(_0x2dfcb6);
        };
        var _0x20edeb = function(_0x435512, _0x250ca3) {
            var _0x3cc21b = [],
                _0x52a0a7 = 0x0,
                _0x51d4e0, _0x45a269 = '';
            _0x435512 = _0x322a3a(_0x435512);
            var _0x2a98d9;
            for (_0x2a98d9 = 0x0; _0x2a98d9 < 0x100; _0x2a98d9++) {
                _0x3cc21b[_0x2a98d9] = _0x2a98d9;
            }
            for (_0x2a98d9 = 0x0; _0x2a98d9 < 0x100; _0x2a98d9++) {
                _0x52a0a7 = (_0x52a0a7 + _0x3cc21b[_0x2a98d9] + _0x250ca3['charCodeAt'](_0x2a98d9 % _0x250ca3['length'])) % 0x100, _0x51d4e0 = _0x3cc21b[_0x2a98d9], _0x3cc21b[_0x2a98d9] = _0x3cc21b[_0x52a0a7], _0x3cc21b[_0x52a0a7] = _0x51d4e0;
            }
            _0x2a98d9 = 0x0, _0x52a0a7 = 0x0;
            for (var _0x40e152 = 0x0; _0x40e152 < _0x435512['length']; _0x40e152++) {
                _0x2a98d9 = (_0x2a98d9 + 0x1) % 0x100, _0x52a0a7 = (_0x52a0a7 + _0x3cc21b[_0x2a98d9]) % 0x100, _0x51d4e0 = _0x3cc21b[_0x2a98d9], _0x3cc21b[_0x2a98d9] = _0x3cc21b[_0x52a0a7], _0x3cc21b[_0x52a0a7] = _0x51d4e0, _0x45a269 += String['fromCharCode'](_0x435512['charCodeAt'](_0x40e152) ^ _0x3cc21b[(_0x3cc21b[_0x2a98d9] + _0x3cc21b[_0x52a0a7]) % 0x100]);
            }
            return _0x45a269;
        };
        _0x55de['iZXTZt'] = _0x20edeb, _0x55de['nqzJpH'] = {}, _0x55de['mrOGMn'] = !![];
    }
    var _0x2caed5 = _0x4c8687[0x0],
        _0x3d3a9b = _0x3cdaad + _0x2caed5,
        _0x109545 = _0x55de['nqzJpH'][_0x3d3a9b];
    return !_0x109545 ? (_0x55de['SBapHu'] === undefined && (_0x55de['SBapHu'] = !![]), _0x55de40 = _0x55de['iZXTZt'](_0x55de40, _0x23f0f0), _0x55de['nqzJpH'][_0x3d3a9b] = _0x55de40) : _0x55de40 = _0x109545, _0x55de40;
}
$(function() {
    var _0x208f45 = _0x55de,
        _0x2bd226 = {
            'LpxAt': function(_0x376185) {
                return _0x376185();
            },
            'opYyd': function(_0x5d511a, _0x2b9b0d) {
                return _0x5d511a(_0x2b9b0d);
            },
            'aHFEG': function(_0x582d7d, _0x42e2cd) {
                return _0x582d7d * _0x42e2cd;
            },
            'eokqE': function(_0x229c8b, _0x50e7fc) {
                return _0x229c8b / _0x50e7fc;
            },
            'EGKkz': function(_0x1880ff, _0x1e4dfc) {
                return _0x1880ff * _0x1e4dfc;
            },
            'iTJlN': function(_0x2618c0, _0x5cba8b) {
                return _0x2618c0 / _0x5cba8b;
            },
            'RLfHZ': function(_0x4f8182, _0x3c367e) {
                return _0x4f8182(_0x3c367e);
            },
            'qfiwo': function(_0x28f18e, _0x1185b6) {
                return _0x28f18e(_0x1185b6);
            },
            'fPFwj': function(_0x1a4a69, _0x2d08fc) {
                return _0x1a4a69 / _0x2d08fc;
            },
            'uAJRc': function(_0x2b29a0, _0x442641) {
                return _0x2b29a0(_0x442641);
            },
            'ZiUVe': function(_0x1f6823, _0x377f9f) {
                return _0x1f6823(_0x377f9f);
            },
            'bZvJY': function(_0x2d75d9, _0x134b7b) {
                return _0x2d75d9 / _0x134b7b;
            },
            'TAttp': function(_0x5c1642, _0x833a37) {
                return _0x5c1642 === _0x833a37;
            },
            'JNGVS': function(_0x4fcf99, _0x20ed4d) {
                return _0x4fcf99 !== _0x20ed4d;
            },
            'jErRh': 'hcLKV',
            'KrHHk': function(_0x1fe228, _0x326d5f) {
                return _0x1fe228(_0x326d5f);
            },
            'Sgsqr': function(_0x56fb73) {
                return _0x56fb73();
            },
            'oIiQa': function(_0x380912, _0x32688d) {
                return _0x380912(_0x32688d);
            },
            'Oxccg': function(_0x486a94, _0x22d08e) {
                return _0x486a94(_0x22d08e);
            },
            'ufqDt': function(_0x32d1f5, _0x4eca4c) {
                return _0x32d1f5(_0x4eca4c);
            },
            'lBPEi': function(_0x667b38, _0x5ea2c1) {
                return _0x667b38(_0x5ea2c1);
            },
            'IvBoE': function(_0x5b4239, _0xf0df27) {
                return _0x5b4239(_0xf0df27);
            },
            'ePAnV': function(_0x3b03a2, _0x10d4f2) {
                return _0x3b03a2 - _0x10d4f2;
            },
            'RbxAI': function(_0x23cb24, _0x5ae60a) {
                return _0x23cb24 / _0x5ae60a;
            },
            'isnDs': function(_0x3c3aa7, _0x379cb6) {
                return _0x3c3aa7(_0x379cb6);
            },
            'GYZPH': function(_0x1fc14a) {
                return _0x1fc14a();
            },
            'OqqMI': function(_0x33fc5d, _0x4bc65e, _0x3b5a40, _0x38af82) {
                return _0x33fc5d(_0x4bc65e, _0x3b5a40, _0x38af82);
            },
            'iVHMk': function(_0x3ad958, _0x20809d) {
                return _0x3ad958(_0x20809d);
            },
            'kXyRM': function(_0x989324) {
                return _0x989324();
            },
            'CuMve': function(_0x5530ef, _0x2dec3f) {
                return _0x5530ef(_0x2dec3f);
            },
            'MURIv': function(_0x3ab5cc, _0x2cefdb) {
                return _0x3ab5cc(_0x2cefdb);
            },
            'cuufx': function(_0x399d9f, _0x132971) {
                return _0x399d9f(_0x132971);
            },
            'jgMxN': function(_0x33d95b, _0x1b250b) {
                return _0x33d95b * _0x1b250b;
            },
            'zuuBG': function(_0x5aa100, _0x4f342c) {
                return _0x5aa100(_0x4f342c);
            },
            'Cpjzo': function(_0x132a04, _0x3b7204) {
                return _0x132a04 + _0x3b7204;
            },
            'dvbHS': function(_0x4de724, _0x4c647f) {
                return _0x4de724 < _0x4c647f;
            },
            'PAPYF': function(_0x240feb, _0x26951e) {
                return _0x240feb > _0x26951e;
            },
            'XYYgc': function(_0x4c4f03, _0x372ce9) {
                return _0x4c4f03(_0x372ce9);
            },
            'uyCLA': function(_0x4e929c, _0x39b9de) {
                return _0x4e929c / _0x39b9de;
            },
            'UaGCq': function(_0x4b78a2) {
                return _0x4b78a2();
            },
            'hfIxG': function(_0x21db42, _0x2b024b) {
                return _0x21db42(_0x2b024b);
            },
            'MRZmp': function(_0x450fac, _0x25ce75) {
                return _0x450fac(_0x25ce75);
            },
            'bkdWe': function(_0x21d6e7, _0x126bf5) {
                return _0x21d6e7(_0x126bf5);
            },
            'RWzez': function(_0x3b90cd, _0x1ce492) {
                return _0x3b90cd(_0x1ce492);
            },
            'sfgdf': function(_0x696fa6, _0x9b34a) {
                return _0x696fa6(_0x9b34a);
            },
            'JMrCC': function(_0x51cf39, _0xcb2cdf) {
                return _0x51cf39 <= _0xcb2cdf;
            },
            'VxLSy': function(_0x322873, _0x20e953) {
                return _0x322873 <= _0x20e953;
            },
            'wYunn': function(_0x6a6f3c, _0x40f5f5) {
                return _0x6a6f3c(_0x40f5f5);
            },
            'WMuIT': function(_0x24305b, _0xe40232) {
                return _0x24305b(_0xe40232);
            },
            'WYZRG': function(_0x503938, _0x32f86a) {
                return _0x503938(_0x32f86a);
            },
            'YiIeW': function(_0x3a0b98, _0x321bec) {
                return _0x3a0b98(_0x321bec);
            },
            'BkaRx': function(_0xcd30bb, _0x131aff) {
                return _0xcd30bb(_0x131aff);
            },
            'zQHnm': function(_0x187573, _0x4dc431) {
                return _0x187573(_0x4dc431);
            },
            'Kzvdb': function(_0x4c710e, _0x1e14db) {
                return _0x4c710e(_0x1e14db);
            },
            'veDYb': function(_0xc3b359, _0x184fb9) {
                return _0xc3b359(_0x184fb9);
            },
            'aIFxk': function(_0x1c773c, _0x4debaf) {
                return _0x1c773c(_0x4debaf);
            },
            'fqeWB': function(_0x231d47) {
                return _0x231d47();
            },
            'DmZgC': function(_0x23c034) {
                return _0x23c034();
            },
            'cWFyv': function(_0x3c828b, _0x3f8ea4) {
                return _0x3c828b <= _0x3f8ea4;
            },
            'YdJSF': function(_0x18d58f, _0x57bce4) {
                return _0x18d58f <= _0x57bce4;
            },
            'KwzEU': function(_0xd1d661, _0x1776a1) {
                return _0xd1d661(_0x1776a1);
            },
            'DNfpZ': function(_0x164077, _0x5e2c0b) {
                return _0x164077(_0x5e2c0b);
            },
            'rVRSt': function(_0x29ec52, _0x411221) {
                return _0x29ec52(_0x411221);
            },
            'xsPwT': function(_0x1eb769, _0x4d5493) {
                return _0x1eb769(_0x4d5493);
            },
            'wLrzo': function(_0x534a1c, _0x25a34e) {
                return _0x534a1c(_0x25a34e);
            },
            'HswGP': function(_0x2ee326, _0x2408cc) {
                return _0x2ee326(_0x2408cc);
            },
            'YNwuM': function(_0x65fa94, _0x32edf0) {
                return _0x65fa94(_0x32edf0);
            },
            'DYLFm': function(_0x1ca7e1, _0x122f6d) {
                return _0x1ca7e1(_0x122f6d);
            },
            'bvRco': function(_0x53b363, _0x5009bc) {
                return _0x53b363(_0x5009bc);
            },
            'KGIQP': function(_0x3856ce, _0x229875) {
                return _0x3856ce(_0x229875);
            }
        };
    $('#torque,#power,#n1')['on']('change', function() {
        var _0x1f1c02 = _0x55de;
        if (checkTorque() && checkPower() && _0x2bd226["LpxAt"](checkN1)) {
            var _0x4f44d1 = $('#torque')["val"](),
                _0x514c38 = $('#power')["val"](),
                _0x2c5b9a = $('#n1')["val"]();
            'torque' === _0x2bd226["opYyd"]($, this)['attr']('id') && (_0x514c38 = Math["round"](_0x2bd226["aHFEG"](_0x4f44d1, _0x2c5b9a) / 0x254d * 0x3e8) / 0x3e8), 'power' === $(this)["attr"]('id') && (_0x4f44d1 = _0x2bd226["eokqE"](Math['round'](0x254d * _0x514c38 / _0x2c5b9a * 0x3e8), 0x3e8)), 'n1' === $(this)["attr"]('id') && (_0x4f44d1 = Math["round"](_0x2bd226["aHFEG"](_0x2bd226["EGKkz"](0x254d, _0x514c38) / _0x2c5b9a, 0x3e8)) / 0x3e8, _0x514c38 = _0x2bd226["iTJlN"](Math["round"](_0x4f44d1 * _0x2c5b9a / 0x254d * 0x3e8), 0x3e8)), _0x2bd226["RLfHZ"]($, '#torque')["val"](_0x4f44d1), $('#power')["val"](_0x514c38);
        }
    }), $('#n2,#transmissionRatio')['on']('change', function() {
        var _0x5d8d07 = _0x55de,
            _0x180f7c = $('#n2')["val"](),
            _0x1f6808 = $('#n1')['val'](),
            _0x4916ba = _0x2bd226['ZiUVe'](Number, $('#transmissionRatio')["val"]());
        'n2' === $(this)["attr"]('id') && checkN1() && _0x2bd226["LpxAt"](checkN2) && (_0x4916ba = Math["round"](_0x2bd226["bZvJY"](_0x1f6808, _0x180f7c) * 0x3e8) / 0x3e8, $('#transmissionRatio')["val"](_0x4916ba), _0x2bd226["LpxAt"](checkTransmissionRatio)), _0x2bd226["TAttp"]('transmissionRatio', $(this)["attr"]('id')) && _0x2bd226['LpxAt'](checkN1) && checkTransmissionRatio() && (_0x180f7c = Math["round"](_0x1f6808 / _0x4916ba), $('#n2')["val"](_0x180f7c), checkN2());
        var _0x144aac = assumeZ1Query(Number(_0x4916ba["toFixed"](0x0)));
        if (_0x2bd226["JNGVS"](void 0x0, _0x144aac)) {
            if (_0x2bd226["JNGVS"]("hcLKV", _0x2bd226["jErRh"])) {
                var _0x16f0ff = _0x2bd226["qfiwo"](_0x56c807, $('#z1')["val"]()),
                    _0x5e9ce4 = _0x2bd226["qfiwo"](_0x221bbb, $('#z2')["val"]()),
                    _0x5b4674 = _0x26d534($('#assumeZ1')["val"]()),
                    _0xcb6ab8 = _0x4d0988($('#assumeZ2')["val"]()),
                    _0x51963e = _0x5e9ce4 / _0x16f0ff,
                    _0x39027 = _0x18042a["abs"](_0x2bd226['fPFwj'](_0x5e9ce4 / _0x16f0ff - _0xcb6ab8 / _0x5b4674, _0xcb6ab8 / _0x5b4674));
                if ($('#miu')["val"](_0x401626["round"](0x3e8 * _0x51963e) / 0x3e8), $('#deltaMiu')["val"](_0x2bd226["fPFwj"](_0x217ac8['round'](_0x2bd226['aHFEG'](0x2710, _0x39027)), 0x64)), _0x35aac8() && _0x2500ed() && _0x5035db()) {
                    var _0x10a7ca = _0x4138bd(_0x2bd226["uAJRc"]($, '#m')["val"]()),
                        _0xcd485 = _0x53f797($('#centerDisAFinal')["val"]()),
                        _0x41048c = _0x370684($('.d1')["val"]()),
                        _0x136b45 = _0x10a7ca * _0x5e9ce4,
                        _0x1d3aa6 = _0x2bd226['iTJlN'](_0xcd485, _0x10a7ca) - (_0x41048c + _0x136b45) / 0x2 / _0x10a7ca,
                        _0x301b67 = _0x2bd226["eokqE"](_0x3f49ab["atan"](_0x16f0ff * _0x10a7ca / _0x41048c), _0x15fb0c['PI']) * 0xb4;
                    $('#d2')["val"](_0x136b45)["change"](), $('#x2')["val"](_0x1d3aa6), $('#gama')["val"](_0x301b67["toFixed"](0x2));
                }
            } else {
                $('#chkInfo1')["html"]('<font style=\'color:green\'>推荐蜗杆头数z<sub>1</sub>为:' + _0x144aac + '</font>');
                var _0x1ea976 = _0x144aac["substrin" + 'g'](0x0, 0x1);
                _0x2bd226["KrHHk"]($, '#assumeZ1,#z1')["val"](_0x1ea976)['change']();
                var _0x473ed5 = _0x2bd226["EGKkz"](_0x1ea976, _0x4916ba)["toFixed"](0x0);
                if ($('#assumeZ2,#z2')['val'](_0x473ed5)["change"](), checkAssumeZ1() && checkAssumeZ2() && checkTorque()) {
                    var _0x1a2d9c = assumeEfficiencyAndTorque2Calculator(_0x473ed5, _0x1ea976, $('#torque')["val"]());
                    $('#assumeEfficiency')["val"](_0x1a2d9c["assumeEf" + "ficiency"]), $('#torque2')["val"](_0x1a2d9c["torque2"]);
                }
            }
        } else $('#chkInfo1')["html"]('');
    }), $('#assumeZ1')['on']('change', function() {
        var _0x1e9711 = _0x55de;
        if (checkAssumeZ1()) {
            var _0x48514b = _0x2bd226["uAJRc"]($, this)["val"](),
                _0x1f44e1 = $('#torque')["val"](),
                _0x4dcf6d = (_0x48514b * $('#transmissionRatio')['val']())["toFixed"](0x0);
            if (_0x2bd226["KrHHk"]($, '#assumeZ2,#z2')["val"](_0x4dcf6d), $('#z1')["val"](_0x48514b)["change"](), checkAssumeZ2() && _0x2bd226['LpxAt'](checkTorque)) {
                var _0xaf75e3 = assumeEfficiencyAndTorque2Calculator(_0x4dcf6d, _0x48514b, _0x1f44e1);
                $('#assumeEfficiency')["val"](_0xaf75e3["assumeEf" + 'ficiency']), $('#torque2')["val"](_0xaf75e3["torque2"]);
            }
        }
    }), $('#z1,#z2')['on']('change', function() {
        var _0x3ed639 = _0x55de;
        if (_0x2bd226['Sgsqr'](checkZ1) && checkZ2() && checkAssumeZ2() && checkAssumeZ1()) {
            var _0xd59a71 = Number($('#z1')["val"]()),
                _0x45dd2b = Number($('#z2')['val']()),
                _0x617bce = _0x2bd226["oIiQa"](Number, _0x2bd226['uAJRc']($, '#assumeZ1')["val"]()),
                _0x18ea31 = Number(_0x2bd226["Oxccg"]($, '#assumeZ2')['val']()),
                _0x31f1b0 = _0x2bd226["iTJlN"](_0x45dd2b, _0xd59a71),
                _0x2569e8 = Math["abs"]((_0x45dd2b / _0xd59a71 - _0x18ea31 / _0x617bce) / (_0x18ea31 / _0x617bce));
            if (_0x2bd226["ufqDt"]($, '#miu')["val"](Math["round"](0x3e8 * _0x31f1b0) / 0x3e8), _0x2bd226["lBPEi"]($, '#deltaMiu')['val'](Math["round"](0x2710 * _0x2569e8) / 0x64), checkM() && checkCenterDisAFinal() && checkD1()) {
                var _0x45fc1a = Number($('#m')["val"]()),
                    _0x93fcb5 = Number(_0x2bd226["KrHHk"]($, '#centerDisAFinal')["val"]()),
                    _0x202324 = _0x2bd226["IvBoE"](Number, $('.d1')["val"]()),
                    _0x13eb71 = _0x45fc1a * _0x45dd2b,
                    _0x30d827 = _0x2bd226["ePAnV"](_0x93fcb5 / _0x45fc1a, _0x2bd226["RbxAI"](_0x202324 + _0x13eb71, 0x2) / _0x45fc1a),
                    _0x225abc = Math["atan"](_0xd59a71 * _0x45fc1a / _0x202324) / Math['PI'] * 0xb4;
                $('#d2')["val"](_0x13eb71)["change"](), $('#x2')["val"](_0x30d827), _0x2bd226["uAJRc"]($, '#gama')["val"](_0x225abc["toFixed"](0x2));
            }
        }
    }), $('#d2')['on']('change', function() {
        var _0x20a811 = _0x55de,
            _0x51e148 = $('#d2')["val"]();
        $('#distanceL')["val"]((0.9 * _0x51e148)["toFixed"](0x1));
    }), $('#assumeEfficiency')['on']('change', function() {
        var _0x51b6c9 = _0x55de;
        if (_0x2bd226["GYZPH"](checkTorque) && checkAssumeZ1() && _0x2bd226["kXyRM"](checkAssumeZ2)) {
            if ("hABsj" === "aJmxO") {
                var _0x42255 = $(this)["val"](),
                    _0x302be1 = $('#torque')['val'](),
                    _0x1fb5fd = (_0x42255 * $('#transmissionRatio')["val"]())["toFixed"](0x0);
                if ($('#assumeZ2,#z2')["val"](_0x1fb5fd), _0x2bd226["isnDs"]($, '#z1')["val"](_0x42255)["change"](), _0x5d8a8b() && _0x2bd226["GYZPH"](_0x29b44d)) {
                    var _0x214fe0 = _0x2bd226["OqqMI"](_0x34fff6, _0x1fb5fd, _0x42255, _0x302be1);
                    _0x2bd226["Oxccg"]($, '#assumeEfficiency')["val"](_0x214fe0["assumeEf" + "ficiency"]), _0x2bd226['iVHMk']($, '#torque2')['val'](_0x214fe0["torque2"]);
                }
            } else {
                var _0x2574fa = _0x2bd226["CuMve"]($, this)["val"](),
                    _0x58a952 = _0x2bd226["MURIv"]($, '#torque')["val"](),
                    _0x251505 = _0x2bd226["cuufx"]($, '#assumeZ1')["val"](),
                    _0x35dadc = $('#assumeZ2')["val"]() / _0x251505 * _0x58a952 * _0x2574fa;
                $('#torque2')["val"](Math['round'](0x3e8 * _0x35dadc) / 0x3e8);
            }
        }
    }), $('#kA,#kV,#kBeta')['on']('change', function() {
        var _0x526e36 = _0x55de,
            _0x58043e = Math["abs"](kCalculator());
        $('#k')["val"](_0x58043e);
    }), _0x2bd226["DNfpZ"]($, '#n2,#j,#lifeTime')['on']('change', function() {
        var _0x46041e = _0x208f45,
            _0xa172eb = _0x2bd226["jgMxN"](0x3c, $('#n2')['val']()) * _0x2bd226["zuuBG"]($, '#j')['val']() * $('#lifeTime')["val"]();
        $('#cycleTimes')["val"](_0xa172eb["toExpone" + "ntial"](0x2))['change']();
    }), $('#assumeD1A')['on']('change', function() {
        var _0x46b842 = _0x208f45,
            _0xe2e522 = Number($(this)['val']()),
            _0x470af9 = _0x2bd226["Cpjzo"](8.80952380952385 * _0xe2e522 * _0xe2e522 - _0x2bd226["aHFEG"](9.58333333333343, _0xe2e522), 5.17714285714289);
        _0x2bd226['MURIv']($, '#zRou')['val'](Math["round"](0x64 * _0x470af9) / 0x64);
    }), $('#wormWheelMaterial,#basicSigmaHAllowable,#cycleTimes')['on']('change', function() {
        var _0x5795d8 = _0x208f45,
            _0x5d41af, _0x2c2402, _0x281799 = $('#wormWheelMaterial')["val"](),
            _0x10ae14 = _0x2bd226["opYyd"]($, '#basicSigmaHAllowable')['val'](),
            _0x37def2 = $('#cycleTimes')["val"]();
        switch (_0x281799) {
            case '锡青铜':
                _0x2bd226["dvbHS"](_0x37def2, 0x3f7a0) ? _0x37def2 = 0x3f7a0 : _0x2bd226["PAPYF"](_0x37def2, 0xee6b280) && (_0x37def2 = 0xee6b280);
                break;
            case '铝铁青铜':
            case '灰铸铁':
                _0x37def2 = 0x989680;
        }
        _0x2c2402 = _0x2bd226["jgMxN"](_0x10ae14, _0x5d41af = Math["pow"](0x989680 / _0x37def2, _0x2bd226["RbxAI"](0x1, 0x8))), _0x2bd226['XYYgc']($, '#kHN')["val"](Math["round"](_0x2bd226["aHFEG"](0x64, _0x5d41af)) / 0x64), $('#sigmaHAllowable')["val"](_0x2bd226["uyCLA"](Math["round"](_0x2bd226["aHFEG"](0x64, _0x2c2402)), 0x64));
    }), $('#centerDisAFinal,.d1')['on']('change', function() {
        var _0x584ed3 = _0x208f45;
        if (_0x2bd226["UaGCq"](checkCenterDisAFinal) && _0x2bd226["LpxAt"](checkD1)) {
            var _0x41024c = Number($('#centerDisAFinal')["val"]()),
                _0x236cb5 = Number($('.d1')['val']()),
                _0x4c52af = _0x236cb5 / _0x41024c,
                _0x4bd235 = _0x2bd226["hfIxG"](Number, $('#assumeD1A')["val"]());
            $('#d1A')['val'](Math["round"](0x64 * _0x4c52af) / 0x64), _0x4c52af >= _0x4bd235 ? ($('#resultNotOk')["css"]('display', 'none'), $('#resultOk')['css']('display', 'block')) : ($('#resultOk')["css"]('display', 'none'), $('#resultNotOk')["css"]('display', 'block')), _0x2bd226['RLfHZ']($, '.d1')["val"](_0x236cb5);
        }
    }), $('#btn_submit_wormDrive1')['on']('click', function() {
        var _0x289ecd = _0x208f45;
        _0x2bd226["bkdWe"]($, '#errorInfo3')["html"]('');
        var _0x4af188 = _0x2bd226["RWzez"](Number, $('#torque2')["val"]()),
            _0x4702a7 = Number($('#k')["val"]()),
            _0x111abd = Number(_0x2bd226["sfgdf"]($, '#zE')['val']()),
            _0x1cec93 = Number($('#zRou')['val']()),
            _0x7aca1e = _0x2bd226["ufqDt"](Number, $('#sigmaHAllowable')["val"]());
        return isNaN(_0x4af188) || _0x2bd226["JMrCC"](_0x4af188, 0x0) ? (_0x2bd226["XYYgc"]($, '#errorInfo3')["html"]('请检查蜗轮输入转矩T2\uFF01'), !0x1) : _0x1cec93 <= 0x0 || _0x4702a7 <= 0x0 || _0x2bd226["VxLSy"](_0x111abd, 0x0) || _0x2bd226["KrHHk"](isNaN, _0x1cec93) || isNaN(_0x4702a7) || isNaN(_0x111abd) ? ($('#errorInfo3')['html']('请检查公式所需系数\uFF01'), !0x1) : void $['post']('cal/calculation_wormDrive1', {
            'k': _0x4702a7,
            'torque2': _0x4af188,
            'zRou': _0x1cec93,
            'zE': _0x111abd,
            'sigmaHAllowable': _0x7aca1e
        }, function(_0x4182df) {
            var _0x5ad03b = _0x289ecd;
            _0x4182df["flag"] && _0x2bd226["MRZmp"]($, '#centerDisA')["val"](_0x4182df["resultDa" + 'ta']);
        });
    }), $('#btn_submit_wormDrive2')['on']('click', function() {
        var _0x5772b6 = _0x208f45;
        if (!(checkM() && checkZ2() && checkZ1() && _0x2bd226["Sgsqr"](checkD1) && checkCenterDisAFinal())) return $('#errorInfo4')["html"]('请检查输入初始参数\uFF01'), !0x1;
        var _0x46fbf1 = Number($('#m')["val"]()),
            _0x3c326f = Number($('#centerDisAFinal')['val']()),
            _0x4d07d5 = Number(_0x2bd226["hfIxG"]($, '#z2')["val"]()),
            _0xb2de29 = _0x2bd226["wYunn"](Number, _0x2bd226["opYyd"]($, '#z1')["val"]()),
            _0x38920d = Number($('.d1')["val"]());
        $["post"]('cal/calculation_wormDrive2', {
            'm': _0x46fbf1,
            'z2': _0x4d07d5,
            'z1': _0xb2de29,
            'd1': _0x38920d,
            'a': _0x3c326f
        }, function(_0x18ae95) {
            var _0x20dd60 = _0x5772b6;
            _0x18ae95['flag'] && (_0x2bd226["XYYgc"]($, '#gama')["val"](_0x18ae95["resultDa" + 'ta']['gama']), _0x2bd226["wYunn"]($, '#m2d1')["val"](_0x18ae95['resultDa' + 'ta']["m2d1"]), $('#x2')["val"](_0x18ae95["resultDa" + 'ta']['x2']), $('#d2')["val"](_0x18ae95["resultDa" + 'ta']['d2'])["change"](), _0x2bd226["opYyd"]($, '#q')["val"](_0x18ae95["resultDa" + 'ta']['q']));
        });
    }), $('#btn_submit_wormDrive3')['on']('click', function() {
        var _0x589b1c = _0x208f45,
            _0x28f525 = {
                'KnjYI': function(_0x512a35, _0x12bc4e) {
                    var _0x50f0ca = _0x55de;
                    return _0x2bd226["WMuIT"](_0x512a35, _0x12bc4e);
                },
                'KXiYK': function(_0x20fde3, _0x2bcda6) {
                    return _0x20fde3(_0x2bcda6);
                }
            };
        $('#errorInfo4')["html"]('');
        var _0x4c4ab7 = _0x2bd226["bkdWe"](Number, $('#gama')["val"]());
        if (!checkD1() || !checkN1() || isNaN(_0x4c4ab7) || _0x2bd226["JMrCC"](_0x4c4ab7, 0x0)) return _0x2bd226["WYZRG"]($, '#errorInfo4')["html"]('请检查输入初始参数\uFF01')["css"]('color', 'red'), !0x1;
        var _0x38b548 = _0x2bd226["sfgdf"]($, '.d1')["val"](),
            _0x16cdd7 = $('#n1')["val"](),
            _0x5703d5 = _0x2bd226["RLfHZ"]($, '#wormHardness')["val"](),
            _0x5a465a = _0x2bd226["cuufx"]($, '#wormWheelMaterial')["val"]();
        $["post"]('cal/calculation_wormDrive3', {
            'gama': _0x4c4ab7,
            'd1': _0x38b548,
            'n1': _0x16cdd7,
            'wormHardness': _0x5703d5,
            'wormWheelMaterial': _0x5a465a
        }, function(_0xdfa126) {
            var _0x59b500 = _0x589b1c;
            if (_0xdfa126["flag"]) {
                var _0x5f4222 = Number(_0xdfa126["resultDa" + 'ta']["efficien" + 'cy']),
                    _0x30ddd8 = Number(_0x28f525["KnjYI"]($, '#assumeEfficiency')["val"]());
                $('#efficiency')["val"](_0x5f4222), $('#vS')["val"](_0xdfa126["resultDa" + 'ta']['vS']), $('#phiV')['val'](_0xdfa126["resultDa" + 'ta']["phiV"]), _0x5f4222 <= _0x30ddd8 ? _0x28f525['KXiYK']($, '#errorInfo4')['html'](' η \u2264 初算值,以上计算有效')["css"]('color', 'green') : $('#errorInfo4')["html"](' η > 初算值,请将此值带回重算')['css']('color', 'red');
            } else $('#errorInfo4')["html"]('无法计算\uFF0C请手动计算效率\uFF01')["css"]('color', 'red');
        });
    }), $('#btn_submit_wormDrive4')['on']('click', function() {
        var _0x3f7e0a = _0x208f45,
            _0x1d1562 = {
                'ruRPx': function(_0x177d90, _0x401ff5) {
                    var _0x296ac8 = _0x55de;
                    return _0x2bd226["WYZRG"](_0x177d90, _0x401ff5);
                },
                'GvmlA': function(_0x2c8a35, _0x3fd205) {
                    return _0x2c8a35(_0x3fd205);
                },
                'TuGHP': function(_0xf5294f, _0x475486) {
                    return _0xf5294f(_0x475486);
                }
            };
        if ("AVuUh" !== "CxZTS") {
            _0x2bd226["opYyd"]($, '#errorInfo5')["html"]('');
            var _0x2a67fc = _0x2bd226['sfgdf'](Number, $('#torque2')['val']()),
                _0x27804c = _0x2bd226['lBPEi'](Number, _0x2bd226["YiIeW"]($, '#k')["val"]()),
                _0x3d3ab6 = Number($('#yFa2')["val"]()),
                _0x27fb75 = _0x2bd226["ufqDt"](Number, _0x2bd226["BkaRx"]($, '#gama')['val']()),
                _0x1319df = _0x2bd226["cuufx"](Number, _0x2bd226['zQHnm']($, '#m')["val"]()),
                _0x18ee80 = Number($('.d1')["val"]()),
                _0x591b02 = _0x2bd226['Kzvdb'](Number, $('#d2')["val"]()),
                _0x3faff1 = Number(_0x2bd226["BkaRx"]($, '#cycleTimes')["val"]()),
                _0x46d18d = Number(_0x2bd226["veDYb"]($, '#z2')["val"]()),
                _0x2f88dd = _0x2bd226['aIFxk'](Number, $('#sigmaFAllowableBasic')["val"]());
            return _0x2bd226["LpxAt"](checkD1) && _0x2bd226["fqeWB"](checkM) && _0x2bd226["DmZgC"](checkZ2) ? _0x2bd226["cWFyv"](_0x3d3ab6, 0x0) || _0x27804c <= 0x0 || _0x2bd226['YdJSF'](_0x27fb75, 0x0) || _0x2a67fc <= 0x0 || _0x591b02 <= 0x0 || _0x3faff1 <= 0x0 || _0x2f88dd <= 0x0 || isNaN(_0x3d3ab6) || isNaN(_0x27804c) || _0x2bd226["iVHMk"](isNaN, _0x27fb75) || isNaN(_0x2a67fc) || _0x2bd226['RLfHZ'](isNaN, _0x591b02) || isNaN(_0x3faff1) || _0x2bd226["XYYgc"](isNaN, _0x2f88dd) ? (_0x2bd226["KwzEU"]($, '#errorInfo5')["html"]('请检查输入参数\uFF01')["css"]('color', 'red'), !0x1) : void $["post"]('cal/calculation_wormDrive4', {
                'k': _0x27804c,
                'torque2': _0x2a67fc,
                'yFa2': _0x3d3ab6,
                'gama': _0x27fb75,
                'm': _0x1319df,
                'd1': _0x18ee80,
                'd2': _0x591b02,
                'z2': _0x46d18d,
                'cycleTimes': _0x3faff1,
                'sigmaFAllowableBasic': _0x2f88dd
            }, function(_0x2d3d3f) {
                var _0x2970c = _0x3f7e0a;
                if (_0x2d3d3f["flag"]) {
                    var _0x52f919 = _0x1d1562["ruRPx"](Number, _0x2d3d3f['resultDa' + 'ta']["sigmaFAl" + "lowable"]),
                        _0x514061 = _0x1d1562["ruRPx"](Number, _0x2d3d3f["resultDa" + 'ta']['sigmaF']);
                    _0x1d1562["ruRPx"]($, '#yBeta')["val"](_0x2d3d3f["resultDa" + 'ta']["yBeta"]), _0x1d1562["GvmlA"]($, '#zV2')["val"](_0x2d3d3f["resultDa" + 'ta']["zV2"]), $('#kFN')['val'](_0x2d3d3f["resultDa" + 'ta']["kFN"]), _0x1d1562["GvmlA"]($, '#sigmaFAllowable')["val"](_0x52f919), _0x1d1562["ruRPx"]($, '#sigmaF')["val"](_0x514061), _0x514061 <= _0x52f919 ? $('#errorInfo5')["html"]('σ<sub>F</sub> \u2264 [σ<sub>F</sub>] 校核通过')['css']('color', 'green') : _0x1d1562["TuGHP"]($, '#errorInfo5')["html"]('σ<sub>F</sub> > [σ<sub>F</sub>] 校核不通过')["css"]('color', 'red');
                }
            }) : ($('#errorInfo5')["html"]('请检查输入参数\uFF01')["css"]('color', 'red'), !0x1);
        } else _0x2fd6cb["flag"] && $('#centerDisA')["val"](_0x39d8f7["resultDa" + 'ta']);
    }), $('#btn_submit_wormDrive5')['on']('click', function() {
        var _0x397937 = _0x208f45;
        _0x2bd226["XYYgc"]($, '#errorInfo6')["html"]('');
        var _0x5341c5 = Number($('#torque2')["val"]()),
            _0xb68d8a = Number($('#torque')["val"]()),
            _0x12e91c = _0x2bd226['opYyd'](Number, $('#m')["val"]()),
            _0x203e92 = Number($('.d1')["val"]()),
            _0x4c74f8 = Number($('#d2')["val"]()),
            _0x2dbabe = Number($('#distanceL')["val"]());
        return checkD1() && _0x2bd226["UaGCq"](checkM) && checkTorque() ? _0x5341c5 <= 0x0 || _0x4c74f8 <= 0x0 || _0x2dbabe <= 0x0 || _0x2bd226["wLrzo"](isNaN, _0x5341c5) || isNaN(_0x4c74f8) || isNaN(_0x2dbabe) ? (_0x2bd226['HswGP']($, '#errorInfo6')["html"]('请检查输入参数\uFF01')['css']('color', 'red'), !0x1) : void $["post"]('cal/calculation_wormDrive5', {
            'torque': _0xb68d8a,
            'torque2': _0x5341c5,
            'm': _0x12e91c,
            'd1': _0x203e92,
            'd2': _0x4c74f8,
            'distanceL': _0x2dbabe
        }, function(_0x229ad2) {
            var _0x55d007 = _0x397937;
            if (_0x229ad2['flag']) {
                var _0x2541fa = _0x2bd226["DNfpZ"](Number, _0x229ad2["resultDa" + 'ta']["maxY"]),
                    _0x6e7283 = _0x2bd226["ufqDt"](Number, _0x229ad2["resultDa" + 'ta']["yAllowab" + 'le']);
                $('#forceT1')["val"](_0x229ad2["resultDa" + 'ta']["forceT1"]), _0x2bd226["MRZmp"]($, '#forceR1')["val"](_0x229ad2["resultDa" + 'ta']["forceR1"]), $('#dF1')["val"](_0x229ad2["resultDa" + 'ta']["dF1"]), $('#inertia')["val"](_0x229ad2['resultDa' + 'ta']["inertia"]), _0x2bd226['rVRSt']($, '#maxY')["val"](_0x2541fa), $('#yAllowable')["val"](_0x6e7283), _0x2541fa <= _0x6e7283 ? _0x2bd226["MURIv"]($, '#errorInfo6')["html"]('y \u2264 [y] 校核通过')["css"]('color', 'green') : _0x2bd226["xsPwT"]($, '#errorInfo6')["html"]('y > [y] 校核不通过')["css"]('color', 'red');
            }
        }) : ($('#errorInfo6')['html']('请检查输入参数\uFF01')["css"]('color', 'red'), !0x1);
    }), _0x2bd226["BkaRx"]($, '#btn_submit_wormDrive6')['on']('click', function() {
        var _0x7636cc = _0x208f45;
        $('#errorInfo7')['html']('');
        var _0x57e456 = Number($('#efficiency')["val"]()),
            _0x24a245 = _0x2bd226["YNwuM"](Number, _0x2bd226["DYLFm"]($, '#t0')["val"]()),
            _0x2c8d94 = Number(_0x2bd226["zuuBG"]($, '#t1')['val']()),
            _0x5724a9 = Number($('#alphaD')["val"]()),
            _0x115edd = _0x2bd226["bkdWe"](Number, _0x2bd226["bvRco"]($, '#power')['val']());
        return checkPower() ? _0x57e456 <= 0x0 || _0x24a245 <= 0x0 || _0x2bd226["YdJSF"](_0x2c8d94, 0x0) || _0x5724a9 <= 0x0 || _0x2bd226["bvRco"](isNaN, _0x57e456) || isNaN(_0x24a245) || isNaN(_0x2c8d94) || _0x2bd226["qfiwo"](isNaN, _0x5724a9) ? (_0x2bd226["KrHHk"]($, '#errorInfo7')["html"]('请检查输入参数\uFF01'), !0x1) : void $["post"]('cal/calculation_wormDrive6', {
            'efficiency': _0x57e456,
            't0': _0x24a245,
            't1': _0x2c8d94,
            'alphaD': _0x5724a9,
            'power': _0x115edd
        }, function(_0x1469a3) {
            var _0x5c4a4c = _0x7636cc;
            _0x1469a3["flag"] && ($('#coolingArea')["val"](_0x1469a3["resultDa" + 'ta']['coolingA' + "rea"]), _0x2bd226["veDYb"]($, '#minCoolingArea')["val"](_0x1469a3["resultDa" + 'ta']["minCooli" + "ngArea"]));
        }) : (_0x2bd226['ZiUVe']($, '#errorInfo7')["html"]('请检查输入参数\uFF01'), !0x1);
    }), _0x2bd226['KGIQP']($, '#explaination')["click"](function() {
        var _0x283ca1 = _0x208f45;
        'none' === $('article')["css"]('display') ? $('article')["css"]('display', 'block') : $('article')["css"]('display', 'none');
    });
});