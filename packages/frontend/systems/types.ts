import { LocalizedString } from "../types/localization";

export type System = {
  name: string;
  label: LocalizedString;
  systemFunc: (
    params: number[],
    init: number[],
    time: number,
    dt: number,
  ) => number[];
  params: Param[];
  stateVaribles: StateVar[];
  scale: number;
};

export type Param = {
  name: string;
  min: number;
  max: number;
  defaultValue: number;
};

export type StateVar = {
  name: string;
  min: number;
  max: number;
  defaultValue: number;
};
