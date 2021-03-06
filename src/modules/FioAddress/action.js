// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { createCurrencyWallet } from '../../actions/CreateWalletActions'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings'
import type { Dispatch, GetState } from '../../types/reduxTypes'
import { refreshConnectedWalletsForFioAddress, refreshFioNames } from './util'

export const createFioWallet =
  () =>
  (dispatch: Dispatch, getState: GetState): Promise<EdgeCurrencyWallet | any> => {
    const state = getState()
    const fiatCurrencyCode = state.ui.settings.defaultIsoFiat
    return dispatch(createCurrencyWallet(s.strings.fio_address_register_default_fio_wallet_name, Constants.FIO_WALLET_TYPE, fiatCurrencyCode, false, false))
  }

export const refreshAllFioAddresses = () => async (dispatch: Dispatch, getState: GetState) => {
  dispatch({
    type: 'FIO/SET_FIO_ADDRESSES_PROGRESS'
  })
  const state = getState()
  const { currencyWallets } = state.core.account
  const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets

  const { fioAddresses, fioDomains, fioWalletsById } = await refreshFioNames(fioWallets)

  window.requestAnimationFrame(() => {
    dispatch({
      type: 'FIO/SET_FIO_ADDRESSES',
      data: { fioAddresses }
    })
    dispatch({
      type: 'FIO/SET_FIO_DOMAINS',
      data: { fioDomains }
    })
  })

  const { connectedWalletsByFioAddress } = state.ui.fio
  const wallets = Object.keys(currencyWallets).map(walletKey => currencyWallets[walletKey])
  for (const { name, walletId } of fioAddresses) {
    if (!connectedWalletsByFioAddress[name]) {
      const fioWallet = fioWalletsById[walletId]
      if (!fioWallet) continue
      const ccWalletMap = await refreshConnectedWalletsForFioAddress(name, fioWallet, wallets)
      dispatch({
        type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS',
        data: {
          fioAddress: name,
          ccWalletMap
        }
      })
    }
  }
}
