export default type => string => {
  if (string === undefined) {
    return string
  }
  switch (type) {
    case 'object':
      return string |> JSON.parse
    case 'number':
    case 'integer':
      return string |> parseFloat
    case 'boolean':
      return string === 'true'
    default:
      return string
  }
}
