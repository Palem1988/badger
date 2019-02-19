const extension = require('extensionizer')
const Notifications = require('../controllers/transactions/notifications')

class ExtensionPlatform {
  //
  // Public
  //
  reload () {
    extension.runtime.reload()
  }

  openWindow ({ url }) {
    extension.tabs.create({ url })
  }

  closeCurrentWindow () {
    return extension.windows.getCurrent(windowDetails => {
      return extension.windows.remove(windowDetails.id)
    })
  }

  getVersion () {
    return extension.runtime.getManifest().version
  }

  openExtensionInBrowser (route = null, queryString = null) {
    let extensionURL = extension.runtime.getURL('home.html')

    if (queryString) {
      extensionURL += `?${queryString}`
    }

    if (route) {
      extensionURL += `#${route}`
    }
    this.openWindow({ url: extensionURL })
  }

  getPlatformInfo (cb) {
    try {
      extension.runtime.getPlatformInfo(platform => {
        cb(null, platform)
      })
    } catch (e) {
      cb(e)
    }
  }

  showTransactionNotification (txMeta) {
    this._showConfirmedTransaction(txMeta)
  }

  _showConfirmedTransaction (txMeta) {
    this._subscribeToNotificationClicked()

    const notifications = new Notifications()
    const notification = notifications.getNotification(txMeta)
    // TODO: set tx url by network
    // const url = explorerLink(txMeta.hash, parseInt(txMeta.metamaskNetworkId))

    this._showNotification(
      notification.title,
      notification.message,
      notification.url
    )
  }

  _showNotification (title, message, url) {
    extension.notifications.create(url, {
      type: 'basic',
      title: title,
      iconUrl: extension.extension.getURL('../../images/icon-64.png'),
      message: message,
    })
  }

  _subscribeToNotificationClicked () {
    if (
      !extension.notifications.onClicked.hasListener(
        this._viewOnExplorerBitcoin
      )
    ) {
      extension.notifications.onClicked.addListener(this._viewOnExplorerBitcoin)
    }
  }

  _viewOnExplorerBitcoin (txId) {
    if (txId.startsWith('https://')) {
      global.metamaskController.platform.openWindow({ url: txId })
    }
  }
}

module.exports = ExtensionPlatform
