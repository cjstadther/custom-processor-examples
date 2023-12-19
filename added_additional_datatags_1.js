const replaceDataTargetType = (xmlDocument) => {
  userLog.info('Replacing Data Target Type.')
  const target = xml.element(xmlDocument, '/UniversalShipment/Shipment/DataContext/DataTargetCollection/DataTarget')
  const targetType = xml.element(target, './Type')
  targetType.setTextContent('ForwardingBooking')
}

const handleFile = (file) => {
  // get the body
  const source = file.body
  // parse the xml - by default parseFromString will remove namespaces.
  // If you're simply extracting data, then this is ok, however if you're. 
  // modifying an xml document in place, you typically do not want to remove namespaces.
  let xmlDocument
  try {
    xmlDocument = xml.XmlParser.parseFromString(source, { strip_namespace: false })
  } catch (err) {
    userLog.warning(`Skipping invalid xml file ${file.file_name}.`)
    return
  }

  replaceDataTargetType(xmlDocument)

  const orderReferences = xml.elements(xmlDocument, '/UniversalShipment/Shipment/LocalProcessing/OrderNumberCollection/OrderNumber/OrderReference')

  
  const datatags = lodash.map(orderReferences, ( reference ) => {
    return {
      label: 'Order Reference',
      value: xml.text(reference, '.')
    }
  })

  userLog.info(`Processing ${datatags.length} additional data tags.`)
  publishDataTags(datatags)

  const body = new xml.XmlSerializer().serializeToString(xmlDocument)
  return {
    ...file,
    body
  }
}
const returnFiles = sourceFiles.map(handleFile).filter(x => x)

if (returnFiles.length > 0) {
  returnSuccess(returnFiles)
} else {
  returnSkipped(returnFiles)
}