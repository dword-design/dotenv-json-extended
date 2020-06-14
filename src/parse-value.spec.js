import self from './parse-value'

export default {
  works: () => {
    expect({ foo: 'bar' } |> JSON.stringify |> self('object')).toEqual({
      foo: 'bar',
    })
    expect(42 |> self('number')).toEqual(42)
    expect(42.5 |> self('integer')).toEqual(42.5)
    expect('true' |> self('boolean')).toBeTruthy()
    expect('false' |> self('boolean')).toBeFalsy()
  },
}
