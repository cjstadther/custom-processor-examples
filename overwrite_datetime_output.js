class XMLError extends Error {
  constructor (message) {
    super(message)
    this.name = 'XMLError'
  }
}

const select = xpath.useNamespaces()

const parseXML = (body) => {
  return new xmldom.DOMParser({
    errorHandler: {
      warning: w => console.warn(w),
      error: e => { throw new XMLError(e) },
      fatalError: e => { throw new XMLError(e) }
    }
  }).parseFromString(body)
}

const addForwarderNode = (xml) => {
  const shipmentHouseBill = select('//ShipmentHouseBills/ShipmentHouseBill', xml)
  const forwarderAddressNode = xml.createElement('ForwarderNode')

  const codeNode = xml.createElement('Code')
  codeNode.textContent = 'JANILLORD'
  forwarderAddressNode.appendChild(codeNode)

  const nameNode = xml.createElement('Name')
  nameNode.textContent = 'JANEL GROUP INC - ILLINOIS DIVISION'
  forwarderAddressNode.appendChild(nameNode)

  shipmentHouseBill[0].appendChild(forwarderAddressNode)
}

const updateTimes = (xml) => {
  const legs = select('//ShipmentLeg', xml)
  for (const leg of legs) {
    const etaNode = select('./ETA', leg)[0]
    const etdNode = select('./ETD', leg)[0]

    // Update ETA and ETD time portions to 00:00:00
    if (etaNode) {
      etaNode.textContent = etaNode.textContent.replace(/T\d{2}:\d{2}:\d{2}/, 'T00:00:00');
    }

    if (etdNode) {
      etdNode.textContent = etdNode.textContent.replace(/T\d{2}:\d{2}:\d{2}/, 'T00:00:00');
    }
  }
}

const processFile = (file, i) => {
  const body = file.body
  if (!body) return
  const xml = parseXML(body)
  addForwarderNode(xml)
  updateTimes(xml)
  file.body = xml.toString()
  return file
}

const returnPayload = destinationFiles
  .map(processFile)
  .filter(x => x)
if (returnPayload.length > 0) {
  returnSuccess(returnPayload)
} else {
  returnSkipped(returnPayload)
}