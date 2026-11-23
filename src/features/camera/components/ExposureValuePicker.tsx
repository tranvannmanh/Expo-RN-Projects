import { formatIso, formatShutterValue, nearest } from '../lib/exposure';
import type { ExposureParam } from '../types/camera.types';
import { EvScale } from './EvScale';
import { StopDial } from './StopDial';

type ExposureValuePickerProps = {
  param: ExposureParam;
  values: number[];
  value: number;
  onChange: (value: number) => void;
};

const DIAL_LABEL: Record<Exclude<ExposureParam, 'ev'>, string> = {
  shutter: 'SS',
  iso: 'ISO',
};

const DIAL_FORMAT: Record<Exclude<ExposureParam, 'ev'>, (v: number) => string> = {
  shutter: formatShutterValue,
  iso: (v) => formatIso(v).replace('ISO ', ''),
};

/** Sony-style picker: a stop dial for shutter / ISO, a ruler for EV. */
export function ExposureValuePicker({ param, values, value, onChange }: ExposureValuePickerProps) {
  const index = Math.max(0, values.indexOf(nearest(values, value)));
  if (param === 'ev') {
    const evIndex = Math.max(0, values.findIndex((v) => Math.abs(v - value) < 1e-3));
    return <EvScale values={values} index={evIndex} onChange={onChange} />;
  }
  return (
    <StopDial
      label={DIAL_LABEL[param]}
      values={values}
      index={index}
      format={DIAL_FORMAT[param]}
      onChange={onChange}
    />
  );
}
