React Navigation Add-ons
========================

**NOTE: This is an experiment. If you want to use this in your app, please copy the files instead of using the repo directly. The API can change anytime or the repo might be deleted.**

Useful addons for React Navigation.

## Usage

You'd need to wrap the navigators with our `enhance` function. For example, to wrap `StackNavigator`:

```js
import { StackNavigator } from 'react-navigation';
import { enhance } from 'react-navigation-addons';

export default Stacks = enhance(StackNavigator)({
  Home: { screen: HomeScreen },
  Settings: { screen: SettingsScreen },
});
```

## API

### `navigation.setOptions`

Navigation options are usually tightly coupled to your component. This method allows you to configure and update the navigation options from your component rather than using the static property and params, which means you can use your component's props and state, as well as any instance methods.

**Example:**

```js
class HomeScreen extends Component {
  componentWillMount() {
    this.props.navigation.setOptions({
      headerTitle: this.props.navigation.state.params.user,
      headerTintColor: this.props.theme.tintColor,
      headerLeft: (
        <TouchableOpacity onPress={this._handleSave}>
          <Text>Save</Text>
        </TouchableOpacity>
      )
    });
  }

  componentWillReceiveProps(nextProps) {
    this.props.navigation.setOptions({
      headerTitle: nextProps.navigation.state.params.user,
      headerTintColor: nextProps.theme.tintColor,
    });
  }

  _handleSave = () => {
    ...
  };

  render() {
    ...
  }
}
```

~~Calling `setOptions` with an plain object does a merge with previous options. You don't have to pass the full configuration object again.~~

*It can be a function too and does not update current navigationOptions.*

*`navigationOptions` as `function` also works with it.*

```js
class HomeScreen extends Component {
  static navigationOptions = ({navigation}) => {
    const params = navigation.getState().params;
    return {
      headerTitle: params.user,
    }
  };
  
  componentWillMount() {
    this.headerLeft = (
      <TouchableOpacity onPress={this._handleSave}>
        <Text>Save</Text>
      </TouchableOpacity>
    );
    this.props.navigation.setOptions({
      headerTintColor: this.props.theme.tintColor,
      headerLeft: this.headerLeft
    });
  }

  componentWillReceiveProps(nextProps) {
    this.props.navigation.setOptions({
      headerTintColor: nextProps.theme.tintColor,
      headerLeft: this.headerLeft
    });
  }

  // ...
}
```

### `navigation.addListener`

Sometimes you want to do something when the screen comes into focus, for example fetch some data, and cancel the operation when screen goes out of focus. This method allows you to listen to events like `focus` and `blur`.

**Example:**

```js
class HomeScreen extends Component {
  componentDidMount() {
    this.props.navigation.addListener('focus', this._fetchData);
    this.props.navigation.addListener('blur', this._cancelFetch);
  }

  componentWillUnmount() {
    this.props.navigation.removeListener('focus', this._fetchData);
    this.props.navigation.removeListener('blur', this._cancelFetch);
  }

  _fetchData = () => {
    ...
  };

  _cancelFetch = () => {
    ...
  };

  render() {
    ...
  }
}
```

In addition to `focus` and `blur`, this also allows you to listen to a `change` event which fires whenever the navigation state changes. The listener receives the state as the argument.

**Example:**

```js
class HomeScreen extends Component {
  componentDidMount() {
    this.props.navigation.addListener('change', this._handleStateChange);
  }

  componentWillUnmount() {
    this.props.navigation.removeListener('change', this._handleStateChange);
  }

  _handleStateChange = state => {
    ...
  };

  render() {
    ...
  }
}
```

### `navigation.getParent`

Many times you need a reference to the parent navigation prop if you want to dispatch an action on the parent navigator. This method returns a reference to the navigation prop of the parent navigator.

**Example:**

```js
class SettingsScreen extends Component {
  _popAllTabs = () => {
    const parent = this.props.navigation.getParent();

    if (parent) {
      parent.goBack(null);
    }
  };

  render() {
    ...
  }
}
```

If there's no parent navigator, this method will return `undefined`.

### `navigation.getState`

This method is returns the current state of Route.

**Example:**

```js
class DetailsScreen extends Component {
  static navigationOptions = ({navigation}) => {
    const params = navigation.getState().params;
    return {
      title: params && params.title
    };
  }
  
  // ...
}
```

### `navigation.setParams`

This method is short and alternate way to setParams of current Route.

**Example:**

```js
class DetailsScreen extends Component {
  changeItem = (item) => {
    this.props.navigation.setParams({item});
  };
  
  // ...
}
```

### `navigation.replace`

This method is short and alternate way to reset routes.

**Example:**

```js
class GameOverScreen extends Component {
  startOver = (item) => {
    const {navigation} = this.props;
    navigation.replace([
      {routeName: 'Home'},
      {routeName: 'Play'}
    ]);
    // or
    this.props.navigation.replace.call(this.props.navigation, [
      {routeName: 'Home'},
      {routeName: 'Play'}
    ]);
    
    // replace without stack
    navigation.replace("Home", {paramKey:"value"});
    // or with object
    navigation.replace({routeName:"Home", params:{paramKey:"value"}});
  };
  
  // ...
}
```

Second parameter take **index** which is *optional*, defaults it to array's last route.
