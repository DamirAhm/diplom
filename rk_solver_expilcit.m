classdef rk_solver_expilcit
   properties
       A
       b
       c
       Ts 
       Tmax
   end
   methods
       function obj = rk_solver_expilcit(A, b, c)
           flag = 0;
           if nargin == 0
               A = 'RK4';
               flag = 1;
           end
           if nargin == 1 || flag == 1
               if strcmp(A, 'RK1') || strcmp(A, 'Euler')
                   obj.A = 0; 
                   obj.b = 1;
                   obj.c = 0;
               elseif strcmp(A, 'RK2') || strcmp(A, 'Heun')
                   obj.A = [0 0; 1 0]; 
                   obj.b = [1/2 1/2];
                   obj.c = [0 1];
               elseif strcmp(A, 'RK8') || strcmp(A, 'Dopri')
                   obj.A = [0 0 0 0 0 0 0;...
                        1/5 0 0 0 0 0 0;...
                        3/40 9/40 0 0 0 0 0;...
                        44/45 -56/15 32/9 0 0 0 0;...
                        19372/6561	-25360/2187	64448/6561	-212/729 0 0 0;...
                        9017/3168	-355/33	46732/5247	49/176	-5103/18656 0 0;...
                        35/384	0	500/1113	125/192	-2187/6784	11/84 0];
	                obj.b = [5179/57600 0 7571/16695 393/640 -92097/339200 187/2100 1/40];
	                obj.c = [0 1/5 3/10 4/5 8/9 1 1];
               else 
                   obj.A = [0 0 0 0; 1/2 0 0 0; 0 1/2 0 0; 0 0 1 0]; 
                   obj.b = [1/6 1/3 1/3 1/6];
                   obj.c = [0 1/2 1/2 1];
                   if ~strcmp(A, 'RK4')
                       fprintf("rk_solver: no specified method found, explicit Runge-Kutta 4 used\n");
                   end
               end
               A = obj.A;
           else
               obj.A = A;
               obj.b = b;
               obj.c = c;
           end
       end

       function [t,y,nevals] = run(obj, fun, y0)
               [t,y,nevals] = solve(obj, fun, obj.Tmax, y0, obj.Ts);
       end
       function [t,y,nevals] = solve(obj, fun, time, y0, h)
           
           
           
 
           t = 0:h:time;
           yi = y0;
           r = zeros(length(y0), length(t));
           
           s = length(obj.b);
           n = length(y0);
           nevals = 0;

           for i=1:length(t)
               r(:,i) = yi;
               yi_saver = yi;
               ti = t(i);
               
               yi = yi_saver;
               yi1 = erk_iteration(ti, yi);
   
               yi = yi1; 
               yi = yi1;
           end
           y = r;
           function f = ifeval(fun, t, y)
               nevals = nevals + 1;
               f = feval(fun, t, y);
           end
           function yn_plus_1 = erk_iteration(tn, yn)
                  
                  k = zeros(n, s);
                  k(:, 1) = h * ifeval(fun, tn + obj.c(1)*h, yn);
                  
                  for q=2:s
                      xk = yn;
                      for j=1:q-1
                         xk = xk + obj.A(q, j)*k(:, j);  
                      end
                      k(:, q)= h * ifeval(fun, tn + obj.c(q)*h, xk);
                  end
                  
                  yn_plus_1 = yn;
                  for j=1:s
                      yn_plus_1 = yn_plus_1 + obj.b(j)*k(:, j);
                  end
           end

       end
   end
end