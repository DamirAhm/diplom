Neurocomputing 624 (2025) 129454

Contents lists available at ScienceDirect

Neurocomputing

journal homepage: www.elsevier.com/locate/neucom

Bio-inspired neuron based on threshold selector and tunnel diode capable of
excitability modulation

Valerii Ostrovskii a,b, Timur Karimov a,b
Viacheslav Arlyapov c, Denis Butusov b
a Youth Research Institute, Saint Petersburg Electrotechnical University ‘‘LETI’’, Russia
b Computer-Aided Design Department, Saint Petersburg Electrotechnical University ‘‘LETI’’, Professora Popova St. 5, Saint Petersburg, 197022, Russia
c Tula State University, Lenin Prospekt 92, Tula, 300012, Russia

, Vyacheslav Rybin a,b
,∗

, Yulia Bobrova b

,

A R T I C L E I N F O

A B S T R A C T

Communicated by Y.-m. Cheung

Keywords:
Neuromorphic systems
Artificial neuron
Compact modeling
Threshold switching
Volatile memristor
Tunnel diode

Understanding the neuron behavior is essential for advancing power-efficient neuromorphic computing. This
paper represents a novel model of the spiking neuron obtained by combining a threshold-switching selector
with a tunnel diode. The study investigates the circuitry, identification of models for the basic nonlinear
elements, and dynamical behavior of the proposed bio-inspired neuron. The proposed neuron circuit comprises
only five elements forming three parallel branches: a volatile memristor in series with a tuning DC voltage
source, a tunnel diode in series with a modulatory DC voltage source, and a capacitor. The bidirectional
threshold switching selector device AND-TS serves as an example of a volatile memristor. In its empirical
compact model, selected parameters enable replication of the main kinetic and dynamic characteristics
exhibited by the AND-TS device. Models of four various germanium backward tunnel diodes (GI401A, GI403A,
BD4, and BD5) are also identified, allowing accurate representation of their electrical characteristics. The study
explores the dynamical behavior of the proposed neuron using high-resolution two-parametric diagrams. These
diagrams reveal different operating modes, providing insight into the neuron’s response to different input
stimuli. An assessment of the energy characteristics of the proposed neuron design is given. Additionally, we
provide a SPICE model of the developed neuron for its rapid deployment in field solutions.

1.  Introduction

Artificial  neural  networks  (ANN)  have  seen  substantial  advance-
ments over the last decade [1–4], driven by the rise of big data and the
rapid developments in deep machine learning (ML) reinforced by en-
hanced parallel computational capabilities. With the widespread adop-
tion of ANN technologies, the future holds the promise of even more
transformative changes in this field [5]. Further ANN progress faces sig-
nificant challenges in terms of energy consumption for the underlying
electronic hardware, which traditionally rely on von Neumann archi-
tecture where the physical separation of computing and storage units
imposes costly data transfer. The imperfection inherent in architectural
design  is  sharpened  by  the  limitations  of  the  element  base  formed
through complementary metal–oxide–semiconductor (CMOS) technol-
ogy. As silicon-based technology approaches its physical boundaries,
the scaling task becomes increasingly challenging [6].

The  design  of  neuromorphic  systems  aims  to  address  the  known
limitations of energy efficiency and scalability for classical computing
systems based on the von Neumann architecture. Inspired by the struc-
ture and principles of a brain, neuromorphic systems tend to perform

calculations in synaptic memory, encoding information in pulse signals
produced  by  neurons.  In  abstraction  from  the  spatial  structure  of  a
biological neuron, as a single component it performs the functions of
receiving and summing input signals, generating in response to suffi-
cient stimulation action potentials or ‘‘spikes’’, which are transmitted
as an output signal. The strength of neural connections can be adjusted
through various mechanisms of synaptic plasticity, enabling the brain’s
adaptation  to  incoming  information.  These  structural  and  functional
features of the brain form the basis for the investigation, design, and
production of neuromorphic electronics.

Newly  developed  analog  electronic  components,  which  exhibit
memory  effects  at  the  nanoscale  via  resistance  switching,  are  now
recognized as crucial nonlinear elements for executing dynamic pro-
cesses both in artificial neurons and synapses. The recently reported
devices  also  benefit  from  their  fast  resistive  switching  speed  (sub-
ns  scale  [7]),  high  endurance  (> 106 cycles  [8]),  low  power  con-
sumption  (fJ  range  [9]),  and  large-scale  CMOS  integration  compat-
ibility  [10].  Mathematically,  such  devices  are  often  represented  by

∗ Corresponding author.

E-mail address: dnbutusov@etu.ru (D. Butusov).

https://doi.org/10.1016/j.neucom.2025.129454
Received 21 June 2024; Received in revised form 15 December 2024; Accepted 16 January 2025
Available online 23 January 2025
0925-2312/© 2025 Elsevier B.V. All rights are reserved, including those for text and data mining, AI training, and similar technologies.

V. Ostrovskii et al.

Table 1
Artificial memristor-based spiking neuron models.
Model type
HH
Quasi-HH
LIF
LIF
LIF
LIF
LIF
LIF

Memristive device
Pt/NbO2/Pt
W/WO3/Pt 𝑃 𝐸 𝐷 𝑂 𝑇 ∶ 𝑃 𝑆 𝑆
Au/𝐼 𝑇 𝑂 CH3NH3PbI3
Ag/SiO2/Au
Si/NbO𝑥/TiN
Ag/HfO2
Pt/FeO𝑥/Ag
Cu/MXene/Cu

LIF
LIF
LIF
LIF
LIF
MIF
IF
IF

Cu-Ta/𝐼 𝐺 𝑍 𝑂/TiN
TiN/Ti HfO2
Pt/SiO𝑥N𝑦: Ag/Pt
Ag/SiO2/Pt
TiN/SiO𝑥
W+Ge2Se3 SDC-M
Ag/TiO2−𝑥/Al
Au/Ni/HfO2

Neurocomputing 624 (2025) 129454

Switching type
Volatile
Volatile
Volatile
Volatile
Volatile
Volatile
Volatile
Volatile (in
operating range)
Nonvolatile
Nonvolatile
Volatile
Volatile
Nonvolatile
Nonvolatile
Nonvolatile
Nonvolatile

Operation quantities
𝑉𝑖𝑛/𝑉𝑜𝑢𝑡
𝑉𝑖𝑛/𝑉𝑜𝑢𝑡
𝑉𝑖𝑛/𝑉𝑜𝑢𝑡
𝑉𝑖𝑛/𝑉𝑜𝑢𝑡
𝑉𝑖𝑛/𝑉𝑜𝑢𝑡
𝑉𝑖𝑛/𝑉𝑜𝑢𝑡
𝑉𝑖𝑛/𝐼𝑜𝑢𝑡
𝑉𝑖𝑛/𝐼𝑜𝑢𝑡

𝑉𝑖𝑛/𝐼𝑜𝑢𝑡
𝑉𝑖𝑛/𝐼𝑜𝑢𝑡 (𝑉𝑜𝑢𝑡)
𝑉𝑖𝑛/𝐼𝑜𝑢𝑡
𝑉𝑖𝑛/𝐼𝑜𝑢𝑡
𝐼𝑖𝑛/𝑉𝑜𝑢𝑡
𝑉𝑖𝑛/𝑉𝑜𝑢𝑡
𝐼𝑖𝑛/𝑉𝑜𝑢𝑡
𝑉𝑖𝑛/𝑉𝑜𝑢𝑡

Auxiliary components
DC voltage source, capacitor, resistor
Operational amplifier, resistor, flip-flop
Operational amplifier, resistor, flip-flop
Capacitor, resistor
Transistor
Capacitor, resistor
–
–

Capacitor, resistor
Transistor, capacitor (operational amplifier)
Capacitor, resistor
Capacitor, resistor
–
DC voltage sources, capacitor, resistor
Negative differential resistor, diode, resistors
CMOS peripheral circuits

Ref.

[19]
[20]
[21]
[22]
[23]
[24]
[25]
[26]

[27]
[28]
[29]
[30]
[31]
[32]
[33]
[34]

memristive systems (briefly memristors [11]). Unlike conventional ar-
tificial neurons and synapses that are based solely on CMOS transistors,
memristive components offer greater integration and improved energy
efficiency [12].

The basic idea of using memristors for the emulation of synapses
relies on the adjustment of their conductivity from the high resistance
state  (HRS)  to  the  low  resistance  state  (LRS)  under  electric  pulses
according  to  the  Hebbian  learning  rule:  ‘‘neurons  that  fire  together
wire together’’. Among the dynamical learning mechanisms that obey
this principle, the most famous is the family of spike-timing-dependent
plasticity  (STDP)  rules.  Practical  implementations  of  associative  ML
based on the STDP feature of memristors imply special requirements for
the shape, amplitude, duration, and number of spikes [13–15]. In this
regard, the development of neuron circuits with controllable spiking
properties remains a pressing priority.

Table  1 summarizes  the  known  memristor-based  spiking  neuron
circuits. Features on display are neuron model type, memristor struc-
ture and its switching type, input and output quantities for a neuron
operation, and auxiliary components of a neuron circuit.

Among established biophysical neuron models, the Hodgkin–Huxley
(HH)  model  is  primary,  as  it  offers  a  detailed  electrical  perspective
on  how  action  potentials  are  generated.  This  model  is  defined  by  a
set of differential equations that characterize the neuron membrane’s
conductance.  It  postulates  the  existence  of  specific  ionic  channels,
typically  for  sodium  (Na+)  and  potassium  (K+)  ions,  along  with  a
general  leakage  channel,  and  includes  the  corresponding  ion  pumps
that maintain cellular balance. An equivalent electrical circuit of the
classical HH model actually contains memristive elements to reproduce
the dynamics of ion channels [16]. Although the HH model provides
biomimetic  spiking  patterns  essential  for  neuromorphic  computing,
the  progress  on  its  implementation  is  quite  limited  due  to  circuit
complexity.

The integrate-and-fire (IF) model was proposed to mimic the sim-
plest spiking behaviors in neurons, such as the adaptation of the spiking
rate to the stimulus strength. Neuron models of this type do not take
into account the decay of membrane potential over time. Currently,
leaky  integrate-and-fire  (LIF)  models,  that  add  to  the  IF  the  leaky
term, are more prevalent in neuromorphic systems. The incorporation
of the leaky function is mostly enabled by the inherent volatility of
memristive devices, that spontaneously return back to HRS from LRS
after the removal of external excitation [17]. Here it is necessary to
emphasize the contrast with nonvolatile memristive devices utilized in
synapses,  for  which  the  ability  to  store  their  resistance  state  out  of
power supply for an extended time period (for over a decade [18]) is
substantial. Thus, most of the neurons presented in Table 1 relate to
the LIF models with volatile memristors.

The LIF and IF neuron models presented in Table 1, including those
that consist of just a single memristor, do not provide complex spiking

behavior.  The  HH  and  Quasi-HH  neuron  models,  as  we  mentioned
earlier, required a large number of components in their circuit imple-
mentation. In [32], minimal models of memristive neurons (memristive
integrate-and-fire, MIF), which allow achieving the necessary potential
levels for the formation of a biologically realistic spike, are introduced.
The disadvantage of the MIF circuits is the necessity to apply negative
voltage pulses to switch the memristor into the initial HRS, which limits
its application area in neuromorphic systems.

The essential property of a neuron circuit for its network integration
is the electrical input–output quantities. The selection of these opera-
tion quantities depends on the way artificial neuron circuits interact
with the supposed subcircuits of synapses. Classical biophysical neuron
models predict the membrane output voltage based on electrical stim-
ulation, which is usually the current input. The current input naturally
represents the neural summation as stated in Kirchhoff’s junction rule.
The voltage output is consistent with the threshold-switching mecha-
nisms of memristive synapses. Deviations from these quantities may
require additional circuit components for the signal conversion. As can
be seen from Table 1, most neuron circuits do not meet these criteria.
Adaptability of biophysical neurons to the external electromagnetic
field  can  be  also  addressed  in  the  context  of  memristive  elements.
The  neuron  models  represented  in  [35,36]  suggest  the  inclusion  of
charge-controlled and magnetic flux-controlled memristors to regulate
the neuron spiking modes correlated with a parameter shift and shape
deformation resulting from energy accommodation in the memristive
channels. The capacitive properties and gradient field of the neuron
with  double  membranes  can  be  modeled  by  two  capacitors  coupled
via a memristor [37]. However, these characteristics have so far only
been theoretically estimated using the ideal memristor models without
physical implementation on real resistive switching devices.

Another  important  functionality  of  an  artificial  neuron,  that  has
not been implemented to date, is the capability to adjust the model
parameters to take into account the high device-to-device (D2D) vari-
ability of memristors [38], as well as to control the neuron excitability.
This  paper  presents  a  Quasi-HH  model  of  a  neuron  devoid  of  the
listed  flaws  by  using  a  volatile  memristor  in  parallel  with  a  tunnel
diode  and  a  capacitor  to  form  biologically  realistic  spikes,  as  well
as the inclusion of two DC voltage sources to provide the additional
functionalities. In the proposed neuron model, the volatile memristor
represents the Ag nanodots / Hf O2-based threshold switching selector
device (AND-TS [39,40]), that was previously utilized in the regular
LIF neuron model [24]. We propose SPICE-compatible mathematical
models of nonlinear elements and show regions of representative dy-
namical modes with respect to the model parameters. Hence, the key
contributions of this paper are as follows:

1. A novel bio-inspired neuron model based on a volatile memristor

and a tunnel diode is presented.

2

V. Ostrovskii et al.

2. Models of the AND-TS device and the suitable germanium back-

ward tunnel diodes are structurally and parametrically identified.

3. Potential operational modes for the proposed neuron model are

investigated via a numerical simulation framework.

The  rest  of  the  paper  is  organized  as  follows.  In  Section 2,  we
present the spiking neuron model, including a detailed description of
the identified models of the nonlinear elements. In Section 3, the results
of  the  numerical  simulation  are  represented,  reflecting  the  neuron
features. In Section 4, we discuss the energetic and functional char-
acteristics of a neuron from the perspective of its network integration.
Section 5 concludes the paper.

2.  Neuron circuit

The  proposed  neuron  circuit  involves  five  elements  connected  in
three parallel branches as shown in Fig. 1: volatile memristor 𝑉 𝑀 in
series with tuning DC voltage source 𝐸𝑉 𝑀 , tunnel diode 𝑇𝐷 in series
with modulatory DC voltage source 𝐸𝑇𝐷, and capacitor 𝐶. This simple
circuit represents a single-compartment space-clamped neuron inspired
by the biological HH-type neuron models.

Fig. 1 demonstrates the typical spike waveform 𝑉𝑜𝑢𝑡, produced by
the neuron circuit, that can be divided into three stages. The lower part
of Fig. 1 also shows the key areas of the component’s current–voltage
(I-V) curves responsible for forming the spike shape.

As in most other neuron circuits, spike generation is preceded by
a capacitive accumulation of the input current 𝐼𝑖𝑛 until it reaches the
activation peak value 𝐼𝑝, in our case determined by the tunnel diode 𝑇𝐷
characteristic. Upon overcoming the current barrier 𝐼𝑝, a sharp jump
in voltage occurs towards the conventional forward-bias current of the
diode 𝑇𝐷 (stage 1). The spike height becomes limited by the threshold
switching  voltage 𝑉𝑡ℎ of  the  volatile  memristor 𝑉 𝑀.  Switching  the
memristor 𝑉 𝑀 to the LRS results in a reverse voltage drop (stage 2).
After the spike, return to the resting potential is carried out by leakage
through the diode 𝑇𝐷, a necessary condition for which is switching the
memristor 𝑉 𝑀 to the HRS at the hold voltage 𝑉ℎ (that manifests its
volatile property, stage 3). Thus, the nonlinear circuit elements behave
phenomenologically  like  ion  channels  in  the  HH  model:  the  tunnel
diode 𝑇𝐷 corresponds to a depolarizing current such as Na+, and the
volatile memristor 𝑉 𝑀 to a hyperpolarizing current such as K+.

DC voltage sources, which in biological neuron models provide equi-
librium ionic potentials, are called upon to perform different functions
in our design. We call the 𝐸𝑉 𝑀 source tuning since it is intended to
displace the switching voltages of the memristor 𝑉 𝑀 accounting for
its significant D2D variability. Fig. 1 shows the reverse connection of
the 𝑉 𝑀 device,  decided  for  the  less  cycle-to-cycle  (C2C)  variability
taking place in the negative voltage operation of switching selectors,
which we look at in more detail below. We consider the 𝐸𝑇𝐷 source
as  modulatory,  because  it  controls  the  shift  between  the 𝑉𝑝 and 𝑉ℎ
voltages, as we also further show, influencing the excitability of the
neuron.

Consider that in Fig. 1 the volatile memristor is described by the

= 𝑔(𝑋 , 𝑉 )

extended voltage controlled memristor (EVCM) model [41]:
𝐼𝑉 𝑀 = 𝐺(𝑋 , 𝑉 )𝑉
𝐺(𝑋 , 0) ≠ ∞
𝑑 𝑋
𝑑 𝑡
where 𝐺(𝑋 , 𝑉 ) represents the memductance, a function of the internal
memristor state variable 𝑋 and input voltage source 𝑉 under the con-
dition that 𝐺(𝑋 , 0) is a finite number, 𝑔(𝑋 , 𝑉 ) is the Lipschitz function,
and 𝐼𝑉 𝑀 is the output current. Then, the resulting mathematical model
of the neuron is:

(1)

= 𝐼𝑖𝑛 − 𝐼𝑇𝐷 − 𝐼𝑉 𝑀

𝑑 𝑉𝐶
𝑑 𝑡
= 𝑔(𝑋 , −𝑉𝑉 𝑀 )

𝐶
𝑑 𝑋
𝑑 𝑡

(2)

3

Neurocomputing 624 (2025) 129454

where 𝐼𝑇𝐷 = 𝑓 (𝑉𝐶 + 𝐸𝑇𝐷), 𝐼𝑉 𝑀 = 𝐺(𝑋 , 𝑉𝑉 𝑀 )𝑉𝑉 𝑀 , and 𝑉𝑉 𝑀 = 𝑉𝐶 + 𝐸𝑉 𝑀 .
The  negative  voltage 𝑉𝑉 𝑀 in  the  second  line  of (2) represents  the
inverted  position  of  the  memristor,  which  aims  to  use  the  negative
voltage part of the I-V curve; meanwhile, depending on the specific
device  model  and  its  switching  thresholds,  the  memristor  may  be
positioned non-inverted. Notation is as follows: in the first line of (2),
𝐶 is the capacitor value, 𝑉𝐶 is the voltage across the capacitor (for
our  neuron  model, 𝑉𝑜𝑢𝑡 = 𝑉𝐶 ), 𝐼𝑖𝑛 is  the  input  current, 𝐼𝑉 𝑀 is  the
current flowing through the volatile memristor, and 𝐼𝑇𝐷 is the current
flowing through the tunnel diode, which may be represented as the
function of voltage across the diode 𝑓 (𝑉𝑇𝐷). For the second line, 𝑋 is the
internal state variable of the memristor, and 𝑉𝑉 𝑀 is the voltage across
the memristor. DC voltage sources 𝐸𝑉 𝑀 and 𝐸𝑇𝐷 are used for biasing
voltages  at  the  nonlinear  elements.  Exact  numerical  values,  as  well
as functions 𝑔(𝑋 , 𝑉 ), 𝐺(𝑋 , 𝑉 ), and 𝑓 (𝑉 ) are presented and discussed
further.

2.1.  Volatile memristor model

The formation and rupture of metal conductive filaments is a long-
known  switching  mechanism  of  threshold  selectors  [17].  Since  the
process  of  transferring  enough  energy  to  switch  these  devices  into
another  conducting  state  takes  a  measurable  amount  of  time,  they
exhibit dynamic behavior with resistance influenced by their excitation
history. Given the hysteretic property of these devices and their ability
to have multiple conductive states, the standard memristor formalism
provides  a  suitable  mathematical  structure  for  characterizing  their
performance [19].

The AND-TS [39,40] device exemplifies a high-performing bidirec-
tional threshold switching selector, demonstrating low leakage current
(< 1 pA), high on/off ratio (> 109), fast switching (< 250 ns), and robust
endurance (exceeding 108 cycles). The range of switching voltages of
this selector perfectly matches the peak and valley points of germanium
tunnel diodes, making it appropriate for neuron application.

The  mathematical  model  of  the  AND-TS  device  is  identified  in
the  form  of  a  first-order  volatile  memristor  with  voltage-controlled
threshold switching. The identification process was carried out accord-
ing to the procedures described in our earlier study [42], using the
dynamic route map approach [43]. To maintain the compactness of the
memristor model, the following assumptions are made:

-  the  model  does  not  represent  the  conductivity  decrease  in  the
range |𝑉ℎ| < |𝑉 | < |𝑉𝑡ℎ|, associated with the spontaneous rupture of
weak 𝐴𝑔 filaments in the AND-TS devices [39];

- the model does not explicitly represent negative differential resis-
tance in the absence of data measured with a current sweep (in [39],
the formation and rupture of filaments were controlled by the applied
voltage);

- the model does not take into account the capacitive properties of

the AND-TS devices;

- in the stochastic version of the model, C2C variability is specified
only by the normal distribution of switching voltage values 𝑉𝑡ℎ and
𝑉ℎ, standard deviations of which are taken equally for one direction
of current.

By definition, a memristor model includes dynamic and static com-
ponents, which are respectively described by the differential equation
of the internal state variable of the memristor and the algebraic equa-
tion for the relationship between current and voltage. In our case, the
identified memristor model is phenomenological.

The differential equation of the memristor state variable 𝑋 is de-

(

fined as:
𝑑 𝑋
1
𝑑 𝑡
𝜏𝑆
(

=

𝛼𝑆 (𝑋) =

1 −

𝛼𝑅(𝑋) =

(
1 −

1
1 + 𝑒−𝛽𝑆 (𝑉 )
)
1
𝑒𝑎𝑋+𝑑𝑆
)
1
𝑒𝑎𝑋

)

𝛼𝑆 (𝑋) −

(1 − 𝑋) +

(1 − 𝑋) +

(

1 −

(

1
𝜏𝑅
(

1 −

1 −

1
1 + 𝑒−𝛽𝑅(𝑉 )
)
1
𝑒𝑎(1−𝑋)
1
𝑒𝑎(1−𝑋)+𝑑𝑅

𝑋

𝑋

)

)

𝛼𝑅(𝑋)

(3)

V. Ostrovskii et al.

Neurocomputing 624 (2025) 129454

Fig. 1. Conceptual model of the proposed spiking neuron. The rising edge of the waveform (red arrow 1) is ensured by overcoming the peak current 𝐼𝑝 of the tunnel diode 𝑇𝐷.
The falling edge (red arrow 2) is determined by the threshold switching voltage 𝑉𝑡ℎ of the volatile memristor 𝑉 𝑀. The waveform restoration is carried out after overcoming the
hold switching voltage 𝑉ℎ of the volatile memristor 𝑉 𝑀 (red arrow 3).

𝛽𝑆 (𝑉 ) =

𝛽𝑅(𝑉 ) =

(𝑉 − 𝑉𝑡ℎ+)(𝑉 − 𝑉𝑡ℎ−)
𝑉 2
𝑆
(𝑉 − 𝑉ℎ+)(𝑉 − 𝑉ℎ−)
𝑉 2
𝑅

where 𝜏𝑆 and 𝜏𝑅 are  SET  and  RESET  time  constants, 𝑎 is  kinetic
constant, 𝑑𝑆 and 𝑑𝑅 are SET and RESET kinetic displacement constants,
𝑉𝑡ℎ+ and 𝑉𝑡ℎ− are positive and negative threshold voltages to turn device
on, 𝑉ℎ+ and 𝑉ℎ− are positive and negative hold voltages to turn device
off, 𝑉𝑆 and 𝑉𝑅 are SET and RESET voltage constants.

The current through the memristor 𝐼𝑉 𝑀 is represented by:

𝐼𝑉 𝑀 (𝑋 , 𝑉 ) =

{ 𝑉 𝑋∕𝑅𝑜𝑛+ + 𝐼𝑙 𝑘
𝑉 𝑋∕𝑅𝑜𝑛− − 𝐼𝑙 𝑘

∶ 𝑉 ≥ 0
∶ 𝑉  < 0

(4)

where 𝑅𝑜𝑛+ and 𝑅𝑜𝑛− are  minimal  device  resistances  for  positive  or
negative currents, 𝐼𝑙 𝑘 is leakage current. Note that, in contrast to the
definition of the current 𝐼𝑉 𝑀 according to Ohm’s law in EVCM model
(1),  here  we  include  an  additive  current  component  to  account  for
leakage of physical devices.

The  structure  of  the  volatile  memristor  model,  visualization  of
which can be seen in Fig. 2 (c), is synthesized to reproduce two voltage
switching boundaries 𝑉𝑡ℎ and 𝑉ℎ in each of the forward (+) and reverse
(−) current directions. The model surface shape is specified by the func-
tions 𝛼𝑆∕𝑅(𝑋) and 𝛽𝑆∕𝑅(𝑉 ) in Eq. (3), where the parameters are selected
towards the correspondence of the simulated kinetics and dynamics to
the measurement data of the AND-TS devices [39]. Constant parameters
of the memristor model are: 𝜏𝑆 = 1.2 ⋅ 10−7 s, 𝜏𝑅 = 1.3 ⋅ 10−7 s, 𝑎 = 2,
𝑑𝑆 =  0.05, 𝑑𝑅 =  0.5, 𝑉𝑆 =  0.0099 V, 𝑉𝑅 =  0.0175 V, 𝑅𝑜𝑛+ =  806
Ohm (≈ (16 ⋅ 𝐺0)−1), 𝑅𝑜𝑛− = 1434 Ohm (≈ (9 ⋅ 𝐺0)−1), 𝐼𝑙 𝑘 = 10−12 A.
Switching voltage values for the reference cycles are (see Fig. 2 (b)
top): 𝑉𝑡ℎ+ = 0.267 V, 𝑉ℎ+ = 0.08 V, 𝑉𝑡ℎ− = −0.119 V, and 𝑉ℎ− = −0.006
V. Normal distribution parameters of switching voltage values are (see
Fig. 2 (b) bottom): 𝜎+ =  0.038, 𝜇𝑡ℎ+ =  0.294, 𝜇ℎ+ =  0.08, 𝜎− =  0.01,
𝜇𝑡ℎ− = 0.119, 𝜇ℎ− = −0.006.

In Fig.  2 (a),  the  kinetic  properties  of  the  memristor  model  are
shown.  The  memristor  state  variable 𝑋 (blue  curve)  is  recorded  as

4

applying turn-on voltage (red curve, 1 μ s duration, 100 ns rise and fall,
1.5 V amplitude). The actual set time (𝑋 from 0.0 to 0.8) is less than
210 ns, and the actual reset time (𝑋 from 0.8 to 0.0) is less than 240 ns.
Switching speed closely matches the AND-TS device specifications [39].
The  characteristic  parameters,  that  keep  the  correct  kinetics  of  the
model, are 𝜏𝑆∕𝑅, 𝑎, and 𝑑𝑆∕𝑅.

Fig. 2 (b) shows the correspondence of the switching dynamics of
the volatile memristor model to the AND-TS device measurement data
of 20 sweep cycles in each direction, where the reference cycle data for
the deterministic model version is highlighted. The HRS manifests in
leakage current, the LRS is correctly set at 0.1 mA current compliance
with the selected values of 𝑅𝑜𝑛 and switching dynamics. The switching
slopes, relevant to specifications of 0.66 mV dec-1 for set and 0.65 mV
dec-1 for reset, can be preserved when a simulation step-size ℎ < 10−4
s.  The  key  model  parameters  for  maintaining  such  slopes  are 𝜏𝑆∕𝑅
and 𝑉𝑆∕𝑅, and the insight of their influence is displayed in Fig. 2 (d).
The  SPICE  code  of  the  deterministic  memristor  model  is  presented
in Appendix  A.  The  stochastic  memristor  model  differs  only  in  the
probabilistic  choice  of  switching  voltage  values  obeying  the  normal
distributions.

2.2.  Tunnel diode model

Tunnel diodes, or Esaki diodes, are semiconductor devices with a
negative resistance region. Low output voltage swing and low power
have limited their use several decades ago. Nowadays, tunnel diodes
refer to obsolete devices, even though the mentioned properties are not
disadvantages but benefits in urgent ultra-low-power applications.

Numerous different tunnel diode models have been developed, and
all of them rely on the Gaussian-exponential model by Sze [44]. The
output current of the Gaussian-exponential model is a sum of three ex-
ponential functions representing currents of three tunnel diode region
curves.

The first region is characterized by an increase of the output current
with the input voltage increase, the so-called positive differential resis-
tance (PDR) region. The next region following the peak current point

V. Ostrovskii et al.

Neurocomputing 624 (2025) 129454

Fig. 2. Kinetic and dynamic properties of the volatile threshold switching memristor model. (a) Transient response of a memristor to a turn-on voltage pulse. (b) Bidirectional
threshold switching I–V curves at 0.1 mA current compliance (top), and probability density functions of the stochastic model switching parameters (bottom). (c) Model surface
represented as the dynamic route map. (d) Surface fragment fitting of the simulation cycle.

is the negative differential resistance (NDR) region, characterized by a
decrease in output current with a decrease in voltage. The third region
is also a PDR region, where the device behavior is similar to 𝑝-𝑛 diode
junction with a forward bias.

The exponential nature of these current components is substanti-
ated by the quantum-physical working principle of the tunnel diode.
Meanwhile,  phenomenological  models  with  no  direct  physical  back-
ground  sometimes  provide  better  accuracy  and  computational  effi-
ciency. Thus, a modified Gaussian-exponential model was proposed by
Nafea & Dessouki [45]. The minor difference with the original model
is in 𝐼𝑒𝑥 term with the sum of arctangents instead of an exponential
function.

To develop particular models for our study, we took measurements
from several germanium GI401A diodes (Soviet Union), see Fig. 3, and
made an approximation of the median curve using both Sze and Nafea
models. The last model provided the better accuracy in terms of root
mean square error (RMSE), 𝜖 = 0.6⋅10−6A, against 𝜖 = 1.2⋅10−6A for Sze
model, so we chose the Nafea model. With that, note that the estimate
of the accuracy of the tunnel diode model is rather tentative, since the
tunnel diode characteristics strongly depend on the temperature, on the
individual device properties, and, minor, on the direction of the voltage
sweep during the measurement.

The  measurement  results  are  in  good  agreement  with  the  data
presented  in  the  handbook  on  tunnel  diodes  printed  in  the  Soviet
Union by Bayukov et al. [46]. From this handbook, we also selected

Table 2
Parameters of tunnel diodes models.
Diode

𝑉𝑡

𝐼𝑠(𝐴)
1.16 ⋅ 10−7
1.10 ⋅ 10−7
1.00 ⋅ 10−8
1.00 ⋅ 10−8

𝐼𝑝(𝐴)
2.17 ⋅ 10−5
6.40 ⋅ 10−5
4.80 ⋅ 10−5
1.48 ⋅ 10−5

𝑉𝑝

0.090
0.037
0.040
0.033

𝐼𝑣(𝐴)
−3.22 ⋅ 10−6
6.00 ⋅ 10−6
2.00 ⋅ 10−6
1.00 ⋅ 10−6

𝐷

26
20
24
13

𝐸

0.14
0.09
0.15
0.07

0.066
0.059
0.047
0.049

GI401A
GI403A
BD4
BD5

a diode GI403A to create its model, as this diode was not available
as  an  experimental  sample  to  measure  its  characteristics.  Also,  for
completeness of the numerical study, we approximated the curves of
diodes BD4 and BD5 (General Electric) [47,48].

Parameters of the obtained models are listed in Table 2. The final

equations are as follows:
(
(

))

𝑉
𝑉𝑡

𝑉
𝑉𝑡
(

− exp

−

exp

𝐼𝑡𝑢𝑛𝑛𝑒𝑙 =

𝐼𝑑 𝑖𝑜𝑑 𝑒 = 𝐼𝑠
𝐼𝑝
𝑉𝑝
)
(
t an−1 𝐷(𝑉 − 𝐸) + t an−1 𝐷(𝑉 + 𝐸)

𝑉 − 𝑉𝑝
𝑉 𝑝

𝐼𝑎𝑡𝑎𝑛 = 𝐼𝑣
𝐼𝑇𝐷 = 𝐼𝛴 = 𝐼𝑑 𝑖𝑜𝑑 𝑒 + 𝐼𝑡𝑢𝑛𝑛𝑒𝑙 + 𝐼𝑎𝑡𝑎𝑛

exp

)

−

(5)

The SPICE code of the identified tunnel diode model can be found

in Appendix B.

5

V. Ostrovskii et al.

Neurocomputing 624 (2025) 129454

Fig. 3. A survey on tunnel diodes used in the study. (a) Tunnel diode GI401A measurements processing, where measurements were taken for three device samples at increasing
and decreasing voltage sweep. (b) Visualization of the modified Gaussian-exponential model components of GI401A tunnel diode. (c) Curves of GI401A, GI403A, BD4 and BD5
tunnel diodes models. (d) Measurement circuit used to collect data on GI401A device, with tunnel diode (TD), voltmeter (V), ammeter (A), and variable DC voltage source shown.

3.  Neuron features

3.1.  Spiking patterns

Next, we illustrate the main features of the proposed neuron model.
By default, we consider the circuit with a reverse connection of the
volatile memristor 𝑉 𝑀 (which ensures less C2C variability) and the
voltage 𝐸𝑉 𝑀 = 0 V (can be tuned to address D2D variability), the tunnel
diode 𝑇𝐷 parameters of the GI401A device and the controllable voltage
𝐸𝑇𝐷,  the  capacitance 𝐶 =  22 nF.  The  neuron  model  can  reproduce
the key spiking patterns by adjusting the injected current, as shown
in Fig. 4.

Unlike its biological prototype, the HH model, which is a resonator
in the Izhikevich classification [49], the presented model is an integra-
tor. It has the properties of generating spikes according to the ‘‘all or
none’’ principle, as well as the presence of a refractory period.

By  the  presentative  definition,  a  single  subthreshold  pulse  input
evokes a small graded output potential, while a superthreshold pulse
input  evokes  more  than  twice  as  high  as  an  all-or-none  spike.  The
experiment shown in Fig. 4(a) demonstrates the response of the neu-
ron to subthreshold pulses with different interpulse periods. Being an
integrator, the neuron prefers high-frequency input. Fig. 4(b) shows the
principle of generating all-or-none spikes using the example of three
subthreshold and three superthreshold input pulses of different ampli-
tudes. Fig. 4(c) shows the response of the neuron to superthreshold
pulses with different interpulse periods. The neuron is less excitable
right after the generation of the first spike and cannot generate the
second spike during the refractory period.

The excitation block spiking pattern, shown in Fig. 4(d), we consider
unwanted.  Under  a  prolonged  increase  in  current  input,  the  spiking
generation stops and locks at the value of |𝑉𝑡ℎ| without returning to
the resting potential. This locked mode limits the operating range of
the input current. We also note that due to the design of the circuit,
bursting and inhibition spiking patterns are not possible.

It is worth highlighting the ability of the deterministic neuron model
to exhibit chaos. To demonstrate this behavior, a sinusoidal component
can be added to the external input stimulus current:

𝐼𝑖𝑛 = 𝐼0 + 𝑎𝑒𝑥𝑡 sin(2𝜋 𝑓𝑒𝑥𝑡𝑡)

(6)

where 𝐼0 is a constant current component, which is selected close to the
value 𝐼𝑝 of the tunnel diode, 𝑎𝑒𝑥𝑡 is amplitude, and 𝑓𝑒𝑥𝑡 is frequency of
a sinusoidal current component. Fig. 5 demonstrates the chaotic spike
train  under  parameters 𝐼0 =  2.1 ⋅ 10−5 A, 𝑎𝑒𝑥𝑡 =  0.5 ⋅ 10−6 A,  and
𝑓𝑒𝑥𝑡 = 1000 Hz.

The proposed neuron model is capable of excitability modulation.
Fig.  6 shows  characteristic  frequency-current  (f-I)  curves  for  three
classes of excitability by Hodgkin [50], obtained from the same neuron
by selecting the 𝐸𝑇𝐷 value. The experimental setup of the input signal
for a single 𝐸𝑇𝐷 value is shown in Fig. 6(a).

Hodgkin’s classification scheme is based on the f–I curve which is
continuous (class 1), discontinuous (class 2), or zero value for a single
spike (class 3). In the presented diagrams of Fig. 6 (b-d), the absence
of a value indicates the absence of spikes. Thus, class 1 qualitatively
differs from class 2 by a smooth increase in the spiking frequency, and
the quantitative difference is in maximum frequencies.

6

