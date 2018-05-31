import * as React from 'react';

interface AsyncProps {
  load: Promise<any>;
}

interface Module {
  default: React.ReactType;
}

interface AsyncState {
  loaded?: Module | React.ReactType | null;
}

export default class Async extends React.Component<AsyncProps, AsyncState> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  public componentWillMount() {
    this.props.load.then(c => {
      this.setState({ loaded: c });
    });
  }

  public render() {
    const { loaded } = this.state;
    if (!loaded) {
      return null;
    }
    const defaultExport = (loaded as Module).default;
    const Component: React.ReactType = defaultExport || (loaded as React.ReactType);
    return <Component {...this.props} />;
  }
}
