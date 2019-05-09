import localStorage from 'store'
const cashaccount = require('cashaccounts')
const accounts = localStorage.get('cashaccounts')
const registrations = localStorage.get('cashaccount-registrations')

class CashAccountUtils {
  // persist identifer data to localstorage when registration is confirmed
  static async upsertAccounts () {
    if (registrations === undefined) {
      return
    }

    for (const each of registrations) {
      const account = await this.getIdentity(each.txid)
      account.txid = each.txid
      const exists = this.checkExistsInStorageByTxid(each.txid)
      if (!exists) {
        this.saveAccount(account)
      }
    }
  }

  // get identifier data for confirmed cashaccounts
  static async getIdentity (txid) {
    const parsed = await cashaccount.accountLookupViaTxid(txid)
    if (parsed === undefined) {
      return
    }
    const account = await cashaccount.parseBitdbObject(parsed)
    return account
  }

  // get identifier data for unconfirmed registration
  static async getPendingIdentity (txid) {
    const parsed = await cashaccount.registrationLookupViaTxid(txid)
    if (parsed === undefined) {
      return
    }

    const account = await cashaccount.parseBitdbObject(parsed)
    return account
  }

  // persist identity to localstorage
  static saveAccount (obj) {
    const array = accounts === undefined ? [] : accounts
    array.push(obj)
    localStorage.set('cashaccounts', array)
  }

  // persist registration txid
  static saveRegistration (obj) {
    const array = registrations === undefined ? [] : registrations
    array.push(obj)
    localStorage.set('cashaccount-registrations', array)
  }

  // used to limit to one registration per badger account
  static async checkIsRegistered (selectedAddress) {
    if (registrations === undefined) {
      return
    }

    for (const x of registrations) {
      const { txid } = x
      const account = await this.getPendingIdentity(txid)
      if (account === undefined) {
        return false
      }

      const bchRegistration = account.information.payment[0].address
      if (bchRegistration === selectedAddress) {
        return true
      } else {
        return false
      }
    }
  }

  static checkExistsInStorageByTxid (txid) {
    if (accounts !== undefined) {
      const match = accounts.find(x => x.txid === txid)
      return match
    }
    return false
  }

  static checkExistsInStorageByAddr (bchAddr, slpAddr) {
    if (slpAddr) {
      slpAddr = cashaccount.toSlpAddress(slpAddr)
    }

    if (accounts === undefined) {
      return false
    }
    for (const x of accounts) {
      const { payment } = x.information
      const bchRegistration = payment[0].address
      const slpRegistration = payment[1].address

      if (bchRegistration === bchAddr) {
        return true
      }

      return false
    }
  }

  // retrieve identifier object for associated wallet
  static getAccountByAddr (bchAddr, slpAddr) {
    if (slpAddr) {
      slpAddr = cashaccount.toSlpAddress(slpAddr)
    }
    if (accounts === undefined) {
      return
    }
    for (const x of accounts) {
      const { payment } = x.information
      const bchRegistration = payment[0].address
      const slpRegistration = payment[1].address

      if (bchRegistration === bchAddr) {
        return x
      }
    }
  }

  // used to get information on an unconfirmed account
  static async getRegistrationByAddr (bchAddr) {
    if (registrations === undefined) {
      return
    }
    for (const x of registrations) {
      const { txid } = x

      const account = await cashaccount.registrationLookupViaTxid(txid)
      if (account === undefined) {
        return
      }

      const payment = await cashaccount.parsePaymentInfo(account.opreturn)

      const bchRegistration = payment[0].address
      if (bchRegistration === bchAddr) {
        return x
      }
    }
  }
}

module.exports = CashAccountUtils
