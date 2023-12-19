const addAdditionalReference = (xmlDocument) => {
  const subShipments = xml.elements(xmlDocument, '/UniversalShipment/Shipment/SubShipmentCollection/SubShipment')

  let additionalReferences = xml.element(xmlDocument, '/UniversalShipment/Shipment/AdditionalReferenceCollection')
  if (!additionalReferences) {
    const shipment = xml.element(xmlDocument, '/UniversalShipment/Shipment')
    additionalReferences = shipment.appendChild('AdditionalReferenceCollection')
  }

  lodash.each(subShipments, (subShipment) => {
    const wayBillNumber = xml.text(subShipment, './WayBillNumber')
    const reference = additionalReferences.appendChild('AdditionalReference')
    const type = reference.appendChild('Type')
    type.appendChild('Code', 'CR')
    reference.appendChild('ReferenceNumber', wayBillNumber)
  })
}

const removeSubShipmentCollection = (xmlDocument) => {
  const shipment = xml.element(xmlDocument, '/UniversalShipment/Shipment')
  shipment.removeChild('SubShipmentCollection')
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

  addAdditionalReference(xmlDocument)
  removeSubShipmentCollection(xmlDocument)

  let datatags = []
   
  const containerNumbers = xml.elements(xmlDocument, '/UniversalShipment/Shipment/ContainerCollection/Container/ContainerNumber')
  const containerNumberDataTags = lodash.map(containerNumbers, ( reference ) => {
    return {
      label: 'Container Number',
      value: xml.text(reference, '.')
    }
  })

  const bookingReferences = xml.elements(xmlDocument, '/UniversalShipment/Shipment/AdditionalReferenceCollection/AdditionalReference[Type/Code = "CR"]/ReferenceNumber')
  const bookingReferenceDataTags = lodash.map(bookingReferences, ( reference ) => {
    return {
      label: 'Booking Ref',
      value: xml.text(reference, '.')
    }
  })

  const wayBill = xml.text(xmlDocument, '/UniversalShipment/Shipment/WayBillNumber')
  const wayBillType = xml.text(xmlDocument, '/UniversalShipment/Shipment/WayBillType/Code')
  if (wayBillType === 'MWB') {
    datatags.push({
      label: 'Master Bill',
      value: wayBill
    })
  }
  if (wayBillType === 'HWB') {
    datatags.push({
      label: 'House Bill',
      value: wayBill
    })
  }

  datatags = [...datatags, ...containerNumberDataTags, ...bookingReferenceDataTags]
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