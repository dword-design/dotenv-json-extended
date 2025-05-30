export default (string, type) => {
  if (string === undefined) {
    return string;
  }

  switch (type) {
    case 'object': {
      return JSON.parse(string);
    }

    case 'number':
    // Fall through

    case 'integer': {
      return Number.parseFloat(string);
    }

    case 'boolean': {
      return string === 'true';
    }

    default: {
      return string;
    }
  }
};
