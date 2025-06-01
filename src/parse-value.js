export default (string, type) => {
  if (type === undefined) {
    return string;
  }

  if (string === undefined) {
    return string;
  }

  // Sometimes env variables are empty strings which would fail ajv if they aren't strings
  // (e.g. GitHub env variable set in GitHub Actions but not actually in the admin interface => empty string).
  // Still we want to return them as-is.
  if (string === '' && type !== 'string') {
    return;
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
