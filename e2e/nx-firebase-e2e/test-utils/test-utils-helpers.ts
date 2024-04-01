export function expectStrings(input: string, contains: string[]) {
  contains.forEach((item) => {
    expect(input).toContain(item)
  })
}

export function expectNoStrings(input: string, contains: string[]) {
  contains.forEach((item) => {
    expect(input).not.toContain(item)
  })
}