import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import odeint
from enum import Enum

class RKMethod(Enum):
    RK1 = 1
    RK2 = 2
    RK8 = 8

def generate_cliff(t, amplitude=20e-6, pulse_width=0.008, pulse_period=1e-3, double_pulse_interval=4e-3, offset=0e-6):
    signal = np.zeros_like(t)

    # First pair of pulses
    start1 = 0
    start2 = 0.01
    start3 = 0.02
    start4 = 0.03

    mask1 = (t >= start1) & (t <= start1 + pulse_width)
    mask2 = (t >= start2) & (t <= start2 + pulse_width)
    
    # Second pair of pulses
    mask3 = (t >= start3) & (t <=start3 + pulse_width)
    mask4 = (t >= start4) & (t <= start4 + pulse_width)
    
    signal[(t >= 0) & (t <= 0.0018)] = 25e-6
    signal[(t > 0.0018) & (t <= 0.0095)] = (t-0.0018) * 280e-5 + 25e-6
    return signal + offset

def generate_ladder(t, amplitude=20e-6, pulse_width=0.008, pulse_period=1e-3, double_pulse_interval=4e-3, offset=0e-6):
    signal = np.zeros_like(t)

    # First pair of pulses
    start1 = 0
    start2 = 0.01
    
    mask1 = (t >= start1) & (t <= start1 + pulse_width)
    mask2 = (t >= start2) & (t <= start2 + pulse_width)
    
    signal[mask1] = 25e-6
    signal[mask2] = (t-0.0018) * 280e-5 + 25e-6
    
    return signal + offset

def generate_sinusoidal(t, offset=20e-6, amplitude=15e-6, frequency=2500):
    return offset + amplitude * np.sin(2 * np.pi * frequency * t)

def generate_random(t, mean=250e-6, std=50e-6):
    return np.random.normal(mean, std, len(t))

def set_latex_labels(ax, xlabel, ylabel, title, legend=None):
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    if legend:
        ax.legend(legend)
    plt.tight_layout()

def gi403(e):
    Is = 1.15E-7
    Vt = 1/15
    Vp = 0.09
    Ip = 2.1e-5
    Iv = -3e-6
    D = 26
    E = 0.14
    
    def idiode(e):
        return Is * (np.exp(e/Vt) - np.exp(-e/Vt))
    
    def itunnel(e):
        return Ip/Vp * e * np.exp(-(e - Vp)/Vp)
    
    def iex(e):
        return Iv * (np.arctan(D*(e - E)) + np.arctan(D*(e + E)))
    
    return idiode(e) + itunnel(e) + iex(e)

def gi401(e):
    Is = 1.15e-7
    B = 15
    Ip = 2.1e-5
    Vp = 0.09
    Iv = -3e-6
    D = 26
    E = 0.14
    Cp = 1e-15
    
    def idiode(e):
        return Is * (np.exp(B*e) - np.exp(-B*e))
    
    def itunnel(e):
        return Ip/Vp * e * np.exp(-(e - Vp)/Vp)
    
    def iex(e):
        return Iv * (np.arctan(D*(e - E)) + np.arctan(D*(e + E)))
    
    return idiode(e) + itunnel(e) + iex(e)

def and_ts(V1, V2):
    # Parameters matching SPICE model
    Ron_p = 806
    Ron_n = 1434
    Vth_p = 0.267
    Vh_p = 0.08
    Vth_n = -0.119
    Vh_n = -0.006
    TAUs = 1.2e-7
    TAUr = 1.3e-7
    A = 2.0
    Ds = 0.05
    Dr = 0.5
    Vs = 0.0099
    Vr = 0.0175
    Ilk = 1e-12
    
    # State variable dynamics function F(V1,V2) as specified in SPICE
    Ix = (1/TAUs)*(1/(1+np.exp(-1/(Vs**2)*(V1-Vth_p)*(V1-Vth_n))))*((1-1/(np.exp((A*V2+Ds))))*(1-V2)+V2*(1-1/(np.exp(A*(1-V2))))) - \
         (1/TAUr)*(1-1/(1+np.exp(-1/(Vr**2)*(V1-Vh_n)*(V1-Vh_p))))*((1-1/(np.exp((A*V2))))*(1-V2)+V2*(1-1/(np.exp(A*(1-V2)+Dr))))
    
    # Memristor I-V Relationship as specified in SPICE
    Imem = V1*V2/Ron_p+Ilk if V1 > 0 else V1*V2/Ron_n-Ilk
    
    return Imem, Ix

def nvt(X, t, Iin):
    Vc, XSV = X
    U1 = 0
    U2 = -0.04
    C1 = 22e-9
    
    Vd = Vc + U2
    Vm = Vc + U1
    Id = gi403(Vd)
    Im, Ix = and_ts(Vm, XSV)
    
    dVc = (Iin(t) - Im - Id)/C1
    dXSV = Ix
    
    return [dVc, dXSV]

def rk1_step(f, y, t, h, *args):
    k1 = np.array(f(y, t, *args))
    return y + h * k1

def rk2_step(f, y, t, h, *args):
    k1 = np.array(f(y, t, *args))
    k2 = np.array(f(y + h*k1, t + h, *args))
    return y + h/2 * (k1 + k2)

def rk8_step(f, y, t, h, *args):
    k1 = np.array(f(y, t, *args))
    k2 = np.array(f(y + h/4*k1, t + h/4, *args))
    k3 = np.array(f(y + h/8*(k1 + k2), t + h/4, *args))
    k4 = np.array(f(y + h/2*(-k2 + 2*k3), t + h/2, *args))
    k5 = np.array(f(y + h/6*(3*k1 + 9*k4), t + 3*h/4, *args))
    k6 = np.array(f(y + h/6*(-3*k1 + 2*k2 + 4*k3 + 4*k4), t + h, *args))
    k7 = np.array(f(y + h/48*(7*k1 + 24*k2 + 6*k3 - 8*k4 + 3*k5), t + h, *args))
    k8 = np.array(f(y + h/48*(-7*k1 + 6*k2 + 8*k3 + 3*k4 - 4*k5), t + h, *args))
    return y + h/90*(7*k1 + 32*k3 + 12*k4 + 32*k5 + 7*k6)

def solve_ode(f, y0, t, method=RKMethod.RK2, *args):
    n = len(t)
    h = t[1] - t[0]
    Y = np.zeros((len(y0), n))
    Y[:, 0] = y0
    
    step_func = {
        RKMethod.RK1: rk1_step,
        RKMethod.RK2: rk2_step,
        RKMethod.RK8: rk8_step
    }[method]
    
    for i in range(n-1):
        Y[:, i+1] = step_func(f, Y[:, i], t[i], h, *args)
    
    return Y

def main():
    # Simulation parameters
    Tmax = 50e-3  # Increased simulation time
    h = 0.5e-7
    t = np.arange(0, Tmax, h)
    n = len(t)
    
    # Generate input signal
    Iin = lambda t: generate_sinusoidal(t, offset=35e-6, amplitude=1e-6, frequency=1000)
    
    # Initial conditions
    y0 = [0.2, 0.2]
    
    # Solve ODE using selected method
    Y = solve_ode(nvt, y0, t, RKMethod.RK1, Iin)
    
    # Plotting results
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))
    
    # Plot membrane voltage and input current
    ax1.plot(t, Y[0, :], 'b-', label='Voltage (V)')
    ax1_twin = ax1.twinx()
    ax1_twin.plot(t, [Iin(ti) for ti in t], 'r-', label='Current (A)')
    ax1_twin.set_ylim(2e-5, 2.4e-5)
    ax1.set_ylim(-0.05, 0.3)
    ax1.set_xlim(0, Tmax)
    ax1.set_xlabel('Time (s)')
    ax1.set_ylabel('Voltage (V)', color='b')
    ax1_twin.set_ylabel('Current (A)', color='r')
    ax1.legend(loc='upper left')
    ax1_twin.legend(loc='upper right')
    
    ax2.plot(t, Y[1, :], 'b-', label='Voltage (V)')
    ax2.set_xlabel('Time (s)')
    ax2.set_ylabel('Voltage (V)', color='b')

    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    main() 