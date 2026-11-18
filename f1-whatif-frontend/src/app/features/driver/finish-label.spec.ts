import { finishClass, finishDescription, finishLabel, initials } from './finish-label';

const finished = (position: number) => ({ entered: true, finishPosition: position, positionText: String(position) });
const notClassified = (text: string | null) => ({ entered: true, finishPosition: null, positionText: text });
const absent = { entered: false, finishPosition: null, positionText: null };

describe('finishLabel', () => {
  it('shows the finishing position', () => {
    expect(finishLabel(finished(1))).toBe('1');
    expect(finishLabel(finished(14))).toBe('14');
  });

  it('shows short codes for results without a position', () => {
    expect(finishLabel(notClassified('R'))).toBe('Ret');
    expect(finishLabel(notClassified('D'))).toBe('DSQ');
    expect(finishLabel(notClassified('E'))).toBe('EX');
    expect(finishLabel(notClassified('W'))).toBe('WD');
    expect(finishLabel(notClassified('F'))).toBe('DNQ');
    expect(finishLabel(notClassified('N'))).toBe('NC');
  });

  it('copes with an unknown or missing code', () => {
    expect(finishLabel(notClassified('X'))).toBe('X');
    expect(finishLabel(notClassified(null))).toBe('–');
    expect(finishLabel(notClassified(''))).toBe('–');
  });

  it('shows a dash for a race the driver did not take part in', () => {
    expect(finishLabel(absent)).toBe('–');
  });
});

describe('finishDescription', () => {
  it('spells out the result', () => {
    expect(finishDescription(finished(1))).toBe('Finished 1st');
    expect(finishDescription(finished(2))).toBe('Finished 2nd');
    expect(finishDescription(finished(3))).toBe('Finished 3rd');
    expect(finishDescription(finished(11))).toBe('Finished 11th');
    expect(finishDescription(finished(22))).toBe('Finished 22nd');
    expect(finishDescription(notClassified('R'))).toBe('Retired');
    expect(finishDescription(notClassified('D'))).toBe('Disqualified');
    expect(finishDescription(absent)).toBe('Did not take part');
  });
});

describe('finishClass', () => {
  it('highlights the podium and marks retirements', () => {
    expect(finishClass(finished(1))).toContain('amber');
    expect(finishClass(finished(2))).toContain('zinc-200');
    expect(finishClass(finished(3))).toContain('orange');
    expect(finishClass(finished(9))).toBe('text-zinc-300');
    expect(finishClass(notClassified('R'))).toContain('red');
    expect(finishClass(absent)).toContain('zinc-600');
  });
});

describe('initials', () => {
  it('uses the first letters of the first two words', () => {
    expect(initials('Alain Prost')).toBe('AP');
    expect(initials('Juan Manuel Fangio')).toBe('JM');
    expect(initials('  senna ')).toBe('S');
    expect(initials('')).toBe('');
  });
});
