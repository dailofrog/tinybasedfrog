import { uniq } from 'lodash'
import {rawAddresses} from './_rawaddresses'


export const cleanedAddresses = uniq(rawAddresses.map((a) => a.toLowerCase()))