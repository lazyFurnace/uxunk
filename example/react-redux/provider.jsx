import React from 'react';

import store from '../store';

const { Provider , Consumer } = React.createContext({...store});

export { Consumer };

export default Provider;
