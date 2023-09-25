import React from "react";
import Userid from './Userid';  // Import Userid component

class ParentComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
    };
  }

  componentDidMount() {
    fetch("http://localhost:2000/userid")
      .then((response) => response.json())
      .then((data) => this.setState({ user: data }));
  }

  render() {
    // Now, we can pass the user id to Userid component as a prop
    // We can also use the user id in this component or pass it to other components
    return (
      <div>
        <Userid user={this.state.user} />
        {/* Other components that need the user id */}
      </div>
    );
  }
}

export default ParentComponent;
