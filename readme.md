# User Behavior Visualization
![overview](https://i.imgur.com/RuBM9lt.png "system overview")

Demo
----
**[Demo Site](https://sean721721721.github.io/user-behavior-visualization-demo/)**

**[Demo Video](https://www.youtube.com/watch?v=djDxURjqAgc)**

Abstract
----
Due to the development of the Internet and the popularization of mobile devices, social networking sites have become one of the main channels for modern people to obtain information. People use social media for the purpose of increasing the exposure of various social issues or promoting their ideas. However, people’s opinions are often influenced by opinion leaders on social media, and the influence of opinion leaders is usually accumulated by publishing articles and comments, but it may also be carried by specific groups. Therefore, this research proposes a visual analysis system to visualize the behavior between users, and bipartite relations between users and articles. By observing the activities of users and comparing the differences between different types of users, it can help people understand how to accumulate the influence of the opinion leader, and how do they make their concerns more visible.

Interaction
----
* Brushing interested users to show relationship between their activities and time 

  <img src="https://i.imgur.com/RFlZNON.png" height="300" width="500">
  <img src="https://i.imgur.com/26ZOmeh.png" height="300" width="500">

* Filtering users

  <img src="https://i.imgur.com/F5vwk8m.png" height="300" width="600">

* Scaling

  <img src="https://i.imgur.com/HaHxK0E.png" height="300" width="600">

* Hovering any interested informations

  <img src="https://i.imgur.com/gnsNleD.png" height="400" width="600">

Build
----------------------
To install all dependencies and build the library, run npm install in the root of the project with node v11.0 or higher

    npm install
To automatically rebuild on changes in the source files, once can use

    npm run watch
    
Run
----
Run server

    cd testserver
    node server
