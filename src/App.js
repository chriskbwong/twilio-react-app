import React, { Component } from "react";
import MessageForm from "./MessageForm";
import MessageList from "./MessageList";
import $ from "jquery";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      username: null,
      channel: null
    };
  }

  componentDidMount = () => {
    this.getToken()
      .then(this.createChatClient)
      .then(this.joinGeneralChannel)
      .catch(error => {
        this.addMessage({ body: `Error: ${error.message}` });
      });
  };

  getToken = () => {
    return new Promise((resolve, reject) => {
      this.setState({
        messages: [...this.state.messages, { body: `Connecting...` }]
      });

      $.getJSON("/token", token => {
        this.setState({ username: token.identity });
        resolve(token);
      }).fail(() => {
        reject(Error("Failed to connect."));
      });
    });
  };

  createChatClient = token => {
    return new Promise((resolve, reject) => {
      resolve(new TwilioChat(token.jwt));
    });
  };

  joinGeneralChannel = chatClient => {
    return new Promise((resolve, reject) => {
      chatClient
        .getSubscribedChannels()
        .then(() => {
          chatClient
            .getChannelByUniqueName("general")
            .then(channel => {
              this.addMessage({ body: "Joining general channel..." });
              this.setState({ channel });

              channel
                .join()
                .then(() => {
                  this.addMessage({
                    body: `Joined general channel as ${this.state.username}`
                  });
                  window.addEventListener("beforeunload", () =>
                    channel.leave()
                  );
                })
                .catch(() => reject(Error("Could not join general channel.")));

              resolve(channel);
            })
            .catch(() => reject(Error("Could not find general channel.")));
        })
        .catch(() => reject(Error("Could not get channel list.")));
    });
  };

  handleNewMessage = text => {
    this.setState({
      messages: [...this.state.messages, { me: true, author: "Me", body: text }]
    });
  };

  addMessage = message => {
    const messageData = {
      ...message,
      me: message.author === this.state.username
    };
    this.setState({
      messages: [...this.state.messages, messageData]
    });
  };

  render() {
    return (
      <div className="App">
        <MessageList messages={this.state.messages} />
        <MessageForm onMessageSend={this.handleNewMessage} />
      </div>
    );
  }
}

export default App;
