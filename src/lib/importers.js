/**
 * Importer for customer data from GraphQL-style JSON (response.json)
 */
export const importCustomersFromJSON = (jsonData) => {
  try {
    const edges = jsonData?.data?.business?.customers?.edges || []
    return edges.map(edge => {
      const node = edge.node
      const addr = node.address || {}
      
      // Combine address lines
      const billing_address = [
        addr.addressLine1,
        addr.addressLine2,
        addr.city,
        addr.postalCode
      ].filter(Boolean).join(', ')

      return {
        name: node.name || 'Unknown',
        company_name: node.company_name || '',
        phone: node.phone || node.mobile || '',
        billing_address: billing_address,
        shipping_address: node.shippingDetails?.address?.addressLine1 ? 
          [
            node.shippingDetails.address.addressLine1,
            node.shippingDetails.address.addressLine2,
            node.shippingDetails.address.city,
            node.shippingDetails.address.postalCode
          ].filter(Boolean).join(', ') : '',
        shipping_name: node.shippingDetails?.name || '',
        shipping_phone: node.shippingDetails?.phone || '',
        gstin: node.gstin || '',
        // You can add more fields if the schema supports them
      }
    })
  } catch (err) {
    console.error('Failed to parse JSON for import:', err)
    return []
  }
}

/**
 * Importer for Inventory data
 */
export const importInventoryFromJSON = (jsonData) => {
  try {
    if (!Array.isArray(jsonData)) return []
    return jsonData.map(item => ({
      name: item.itemName || 'Unknown Item',
      description: item.description || '',
      unit: item.unit || 'pcs',
      last_price: Number(item.lastPrice) || 0,
      hsn_code: '',
    }))
  } catch (err) {
    console.error('Failed to parse Inventory JSON:', err)
    return []
  }
}

/**
 * Importer for Invoice/Transaction data
 */
export const importTransactionsFromJSON = (jsonData) => {
  try {
    if (!Array.isArray(jsonData)) return []
    return jsonData.map(inv => {
      const total = Number(inv.invoice_total) || 0
      
      return {
        invoice_number: inv.invoice_number || `INV-${Math.floor(Math.random()*10000)}`,
        invoice_type: 'B2C', // Default to B2C as wave export might not clearly distinguish
        invoice_date: inv.invoice_date || new Date().toISOString().split('T')[0],
        payment_due: inv.due_date,
        customer_snapshot: inv.customer ? {
          name: inv.customer.name,
          billing_address: [inv.customer.address1, inv.customer.address2, inv.customer.city, inv.customer.postal_code].filter(Boolean).join(', ')
        } : { name: 'Unknown Customer' },
        items: [{
          name: 'Imported Balance',
          quantity: 1,
          price: total,
          amount: total
        }],
        subtotal: total,
        total: total,
        notes: inv.memo || '',
        status: inv.status === 'paid' ? 'paid' : 'sent',
      }
    })
  } catch (err) {
    console.error('Failed to parse Invoices JSON:', err)
    return []
  }
}

