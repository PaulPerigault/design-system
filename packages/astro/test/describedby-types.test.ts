import { describe, expectTypeOf, it } from 'vitest';
import Choice from '../src/forms/Choice.astro';
import Input from '../src/forms/Input.astro';
import Select from '../src/forms/Select.astro';
import Switch from '../src/forms/Switch.astro';
import Textarea from '../src/forms/Textarea.astro';

type PropsOf<T extends (...args: never[]) => unknown> = Parameters<T>[1];
type Described = { describedBy: undefined };
type Invalid = { invalid: undefined };

describe('describedBy accepte undefined (exactOptionalPropertyTypes)', () => {
  it('Input, Textarea, Select, Choice, Switch', () => {
    expectTypeOf<Described>().toMatchTypeOf<Pick<PropsOf<typeof Input>, 'describedBy'>>();
    expectTypeOf<Described>().toMatchTypeOf<Pick<PropsOf<typeof Textarea>, 'describedBy'>>();
    expectTypeOf<Described>().toMatchTypeOf<Pick<PropsOf<typeof Select>, 'describedBy'>>();
    expectTypeOf<Described>().toMatchTypeOf<Pick<PropsOf<typeof Choice>, 'describedBy'>>();
    expectTypeOf<Described>().toMatchTypeOf<Pick<PropsOf<typeof Switch>, 'describedBy'>>();
  });

  it('invalid accepte undefined sur les contrôles de saisie', () => {
    expectTypeOf<Invalid>().toMatchTypeOf<Pick<PropsOf<typeof Input>, 'invalid'>>();
    expectTypeOf<Invalid>().toMatchTypeOf<Pick<PropsOf<typeof Textarea>, 'invalid'>>();
    expectTypeOf<Invalid>().toMatchTypeOf<Pick<PropsOf<typeof Select>, 'invalid'>>();
  });
});
