import React, { Component } from 'react';
import Card from '@material/react-card';
import Button from '@material/react-button';
import classnames from 'classnames';
import TextField, { Input } from '@material/react-text-field';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import MaterialIcon from '@material/react-material-icon';
import Tab from '@material/react-tab';
import TabBar from '@material/react-tab-bar';
import WhatsAppIcon from '../icons/whatsapp.svg'; // https://fontawesome.com/icons/whatsapp?style=brands
import TelegramIcon from '../icons/telegram.svg'; // https://fontawesome.com/icons/facebook-messenger?style=brands
import { ReactMultiEmail } from 'react-multi-email';
import './MultiEmailOverride.scss';
import styles from './ShareModal.module.scss';

export default class ShareModal extends Component {
  state = {
    activeIndex: 0,
    emails: [],
  };

  openWhatsApp = () => {
    const urlEncodedText = 'Respond%20to%20ShowFace%20poll!%20' + this.props.link;
    const url = 'https://wa.me/?text=' + urlEncodedText;
    window.open(url, '_blank');
  };

  openTelegram = () => {
    const url =
      'https://telegram.me/share/url?url=' +
      this.props.link +
      '&text=' +
      'Respond to ShowFace poll!';
    window.open(url, '_blank');
  };

  sendInvites = () => {
    // TODO: Send invites to this.emails
    this.setState({ emails: [] });
  };

  render() {
    const linkShareDiv = (
      <div className={styles.tabDiv}>
        <div className={classnames(styles.descText, 'mdc-typography--body2')}>
          Anyone with this link can respond to this poll.
        </div>

        <div id={styles.linkShareRow}>
          <TextField outlined className={styles.copyUrlInput} label="">
            <Input type="text" value={this.props.link} />
          </TextField>
          <CopyToClipboard text={this.props.link}>
            <Button className={styles.clipboardButton} unelevated>
              Copy
            </Button>
          </CopyToClipboard>
        </div>

        <div className={styles.shareRow}>
          <Button
            icon={<img className={styles.socialIcon} src={TelegramIcon} alt="Telegram logo" />}
            onClick={this.openTelegram}
            outlined
          >
            Telegram
          </Button>

          <Button
            icon={<img className={styles.socialIcon} src={WhatsAppIcon} alt="WhatsApp logo" />}
            onClick={this.openWhatsApp}
            outlined
          >
            WhatsApp
          </Button>
        </div>
      </div>
    );

    const { emails } = this.state;
    const { modalHeadline } = this.props;
    const inputEmailDiv = (
      <div className={styles.tabDiv}>
        <div className={classnames(styles.descText, 'mdc-typography--body2')}>
          Email your respondents with a link to this poll.
        </div>

        <ReactMultiEmail
          placeholder="Enter email addresses"
          emails={emails}
          onChange={(emails) => {
            this.setState({ emails });
          }}
          getLabel={(email, index, removeEmail) => {
            return (
              <div data-tag key={index}>
                {email}
                <span data-tag-handle onClick={() => removeEmail(index)}>
                  ×
                </span>
              </div>
            );
          }}
        />
        <Button
          id={styles.inviteButton}
          onClick={this.sendInvites}
          icon={<MaterialIcon icon="send" />}
          disabled={this.state.emails.length === 0}
          raised
        >
          Send Invitations
        </Button>
      </div>
    );

    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className="mdc-typography--headline6">{modalHeadline}</div>
          <div className="mdc-typography--headline6">Invite respondents via...</div>
          <TabBar
            activeIndex={this.state.activeIndex}
            handleActiveIndexUpdate={(activeIndex) => this.setState({ activeIndex })}
          >
            <Tab>
              <span>Link</span>
            </Tab>
            <Tab>
              <span>Email</span>
            </Tab>
          </TabBar>
          {this.state.activeIndex === 0 ? linkShareDiv : inputEmailDiv}
        </Card>
      </div>
    );
  }
}
