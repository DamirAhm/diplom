function neuron_vol_td_sim
%NEURON_VOL_TD_SIM 
close all

[T,Y] = ode15s(@nvt, [0 0.01], [0 0]);
figure;
plot(T, Y(:,1), T, Y(:,2));
title('ODE15S')

Tmax = 30e-3;
%h = 5e-7;
h = 0.5e-7;

Y0 = [0; 0];

solver = rk_solver_expilcit('RK2'); 
% internal signal
[T,Y] = solver.solve(@nvt, Tmax, Y0, h);
figure;
subplot(1,2,1);
plot(T, Y(1,:), T, Y(2,:));

% legend('V_{C1}','XSV')
% xlabel('Time, sec')
% ylabel('V')
setLatexLabels('Time, sec', 'Out', 'Time Plot', {'$v$', '$x$'});

subplot(1,2,2);
plot(Y(1,:), Y(2,:));
% xlabel('V_{C1}, V')
% ylabel('XSV, V')
setLatexLabels('$v$', '$x$', 'Phase Space');

return
%% Hamilton energy
v = Y(1,:);
x = Y(2,:);
Ron = 1434;
Evm = 0.1;
Ik = 1e-12;
Vo = 0.25;
C = 200e-9;
W = x.*(x.*(v + Evm) - Ik*Ron)/2/Ron + 1/2*C*v.^2;
H = W./C/Vo^2;
figure;
plot(T, H);
setLatexLabels('Time, sec', '$H$', 'Hamilton Energy');
%external signal
% a = 0.1;
% om = 2*pi*0.1271;
% t = 0:h:(Tmax-h);
% I = a / om * cos(om * t);
% fun = @(t, Y)FHN_external(t, Y, I, h);
% [T,Y] = solver.solve(fun, Tmax, Y0, h);
% figure;
% subplot(1,2,1);
% plot(T, Y(1,:), T, Y(2,:));
% subplot(1,2,2);
% plot(Y(1,:), Y(2,:));
% title('External signal')

end

function dX = nvt(T, X)

dX = X;
Vc = X(1);
XSV = X(2);
% params
Iin = 66e-6;
U1 = 0;
U2 = 0.1;
C1 = 200e-9;
% eq
Vd = Vc + U1;
Vm = Vc + U2;
Id = GI403(Vd);
[Im, Ix] = AND_TS(Vm, XSV);

dX(1) = (Iin - Im - Id)/C1;
dX(2) = Ix;
end
function [Imem, Ix] = AND_TS(V1, V2)
Ron = 1434;
Roff=1e6;
Von1=0.28;
Voff1=0.14;
Von2=-0.12;
Voff2=-0.006;
TAU=0.0000001;
T=0.5;
boltz = 1.380649e-23;
echarge = 1.602176634e-19;

Ix = (1/TAU)*((    1/(1 + exp(-1/(T*boltz/echarge)*(V1-Von1)*(V1-Von2))   ))*(1-V2)-(    1-(1/(1+exp(-1/(T*boltz/echarge)*(V1-Voff2)*(V1-Voff1))))    )*V2);
G = @(V) (V/Ron+(1-V)/Roff);
Imem =  V1*G(V2);
end
function I = GI403(e)
Is = 1.1E-7;
Vt = 1/17;
Vp = 0.039;%0.037;
Ip = 6.2e-5;%6.4e-5;
Iv = 6e-6;
D = 20;
E = 0.09;
Idiode = @(e)Is * (exp(e./Vt) - exp(-e./Vt));
Itunnel = @(e)Ip/Vp* e.*exp(-(e - Vp)./Vp);
Iex = @(e)Iv * (atan(D*(e - E)) + atan(D * (e + E)));
I = Idiode(e) + Itunnel(e) + Iex(e);
end