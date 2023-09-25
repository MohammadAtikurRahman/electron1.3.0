import React, { useState, useEffect } from "react";
import Userid from './Userid';  // Import Userid component

const ParentComponent = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:2000/userid")
      .then((response) => response.json())
      .then((data) => setUser(data));
  }, []);

  // Now, we can pass the user id to Userid component as a prop
  // We can also use the user id in this component or pass it to other components
  return (
    <div>
      <Userid user={user} />
      {/* Other components that need the user id */}
    </div>
  );
};

export default ParentComponent;
