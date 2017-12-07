/* @flow */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import hoist from 'hoist-non-react-statics';
import shallowEqual from 'shallowequal';
import { NavigationActions } from 'react-navigation';

import type {
  NavigationState,
  NavigationAction,
  NavigationScreenProp,
} from 'react-navigation/src/TypeDefinition';

type ListenerName = 'focus' | 'blur' | 'change';
type Listener = () => void;

type Context = {
  getParentNavigation: () => NavigationScreenProp<
    NavigationState,
    NavigationAction
  >,
  addNavigationStateChangeListener: ((NavigationState) => void) => void,
  removeNavigationStateChangeListener: ((NavigationState) => void) => void,
};

const COUNT_PARAM = '__react_navigation_addons_update_count';

const ScreenNavigationOptions = {
  title: {isFunction: false},
  headerTitle: {isFunction: false},
  header: {isFunction: true},
  headerRight: {isFunction: true},
  headerLeft: {isFunction: true},

  tabBarIcon: {isFunction: true},
  tabBarLabel: {isFunction: true},

  drawerLabel: {isFunction: true},
  drawerIcon: {isFunction: true},
};

const NavigationExtra = {
  setOptions: () => null,
  getParent: () => ({}),
  addListener: () => null,
  removeListener: () => null,
  setParams: () => null,
  getState: function (navigation) {
    return navigation && navigation.state ?
      getActiveRouteState(navigation.state) : this && this.state && getActiveRouteState(this.state) || {};
  },
  replace: function (routes, index) {
    if (!(this && this.navigation)) return;
    this.navigation.dispatch(NavigationActions.reset({
      index: index === undefined ? routes.length - 1 : index,
      actions: routes.map(route => NavigationActions.navigate(route))
    }));
  }
};

export default function enhanceScreen<T: *>(
  ScreenComponent: ReactClass<T>,
): ReactClass<T> {
  let _instance;

  class EnhancedScreen extends Component<void, T, void> {
    static displayName = `enhancedScreen(${ScreenComponent.displayName || ScreenComponent.name})`;

    static _navigationOptions = ScreenComponent.navigationOptions;
    static _routerNavigationOptions = null;
    static navigationOptions = NavigationOptions;

    static contextTypes = {
      getParentNavigation: PropTypes.func,
      addNavigationStateChangeListener: PropTypes.func,
      removeNavigationStateChangeListener: PropTypes.func,
    };

    static childContextTypes = {
      navigation: PropTypes.object,
    };

    constructor(...args) {
      super(...args);
      _instance = this;
    }

    getChildContext() {
      return {
        navigation: this._navigation,
      };
    }

    componentWillMount() {
      this.props.navigation.setParams({ [COUNT_PARAM]: this._updateCount });
    }

    componentDidMount() {
      this.context.addNavigationStateChangeListener(
        this._handleNavigationStateChange,
      );
    }

    shouldComponentUpdate(nextProps) {
      const { state } = this.props.navigation;
      const { state: nextState } = nextProps.navigation;

      // This is a result of a previous `setOptions` call, prevent extra render
      if (state.params) {
        if (
          nextState.params &&
          nextState.params[COUNT_PARAM] === state.params[COUNT_PARAM] + 1
        ) {
          return false;
        }
      }

      return (
        !shallowEqual(this.props, nextProps) ||
        !shallowEqual(state, nextState)
      );
    }

    componentWillUnmount() {
      this.context.removeNavigationStateChangeListener(
        this._handleNavigationStateChange,
      );
    }

    context: Context;

    _updateCount = 0;
    _listeners: { [key: ListenerName]: Array<Listener> } = {};
    _focused: boolean = false;

    _setOptions = options => {
      EnhancedScreen._routerNavigationOptions = options;
      this.setParams({[COUNT_PARAM]: this._updateCount});
      this._updateCount++;
    };

    _getParent = () => this.context.getParentNavigation();

    _addListener = (name: ListenerName, callback: Listener) => {
      if (!this._listeners[name]) {
        this._listeners[name] = [];
      }

      this._listeners[name].push(callback);
    };

    _removeListener = (name: ListenerName, callback: Listener) => {
      if (!this._listeners[name]) {
        return;
      }

      this._listeners[name] = this._listeners[name].filter(
        cb => cb !== callback,
      );
    };

    _handleNavigationStateChange = state => {
      const focused = state.routes[state.index] === this.props.navigation.state;

      if (this._listeners.change) {
        this._listeners.change.forEach(cb => cb(state));
      }

      if (this._listeners.focus && focused) {
        this._listeners.focus.forEach(cb => cb());
      }

      if (this._listeners.blur && !focused) {
        this._listeners.blur.forEach(cb => cb());
      }
    };

    setParams = (params) => {
      const {navigation} = this.props;
      setNavigationParams(navigation, params);
    };

    get _navigation() {
      return {
        ...this.props.navigation,
        ...this._navigationExtra
      };
    }

    get _navigationExtra() {
      return {
        ...NavigationExtra,
        setOptions: this._setOptions.bind(this),
        getParent: this._getParent.bind(this),
        addListener: this._addListener.bind(this),
        removeListener: this._removeListener.bind(this),
        setParams: this.setParams.bind(this),
      };
    }

    render() {
      return <ScreenComponent {...this.props} navigation={this._navigation} />;
    }
  }

  hoist(ScreenComponent, EnhancedScreen);

  return EnhancedScreen;

  function NavigationOptions(config) {
    config.navigation = {
      ...config.navigation,
      ...(_instance && _instance._navigationExtra || NavigationExtra)
    };

    let navigationOptions = {
      ...getNavigationOptions(EnhancedScreen._navigationOptions, config)
    };

    navigationOptions = {
      ...navigationOptions,
      ...getNavigationOptions(EnhancedScreen._routerNavigationOptions, {...config, navigationOptions})
    };

    Object.keys(ScreenNavigationOptions).forEach(name => {
      const {isFunction} = ScreenNavigationOptions[name];
      if (isFunction && typeof navigationOptions[name] === "function") {
        const func = navigationOptions[name];
        navigationOptions[name] = _config => {
          return func({..._config, navigation: {...config.navigation, state: _config.navigation.state}});
        };
      }
    });
    return navigationOptions;
  }
}

function getNavigationOptions(options, config) {
  if (typeof options === "function") {
    return options(config);
  } else if (typeof options === "object") {
    return options;
  }
  return {};
}

function getActiveRouteState(state) {
  if (state.routes) {
    return getActiveRouteState(state.routes[state.index]);
  }
  return state;
}

function setNavigationParams(navigation, params) {
  const {key} = getActiveRouteState(navigation.state);
  navigation.dispatch(NavigationActions.setParams({params, key}));
}
