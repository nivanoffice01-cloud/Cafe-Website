// Capability keys are printed inside each physical table QR. They are not
// exposed by the public menu bundle and let the API distinguish a real table
// scan from somebody typing ?table=4 by hand.
export const orderTables = [
  { id: '1', label: 'Table 01', capacity: 2, zoneName: 'Cafe floor', accessKey: 'mg-t01-7f4c91a8e2b6350d' },
  { id: '2', label: 'Table 02', capacity: 2, zoneName: 'Cafe floor', accessKey: 'mg-t02-82d1b6f5039ac74e' },
  { id: '3', label: 'Table 03', capacity: 4, zoneName: 'Cafe floor', accessKey: 'mg-t03-65a9e1c7482fd30b' },
  { id: '4', label: 'Table 04', capacity: 4, zoneName: 'Cafe floor', accessKey: 'mg-t04-c3b8701d6f9254ae' },
  { id: '5', label: 'Table 05', capacity: 4, zoneName: 'Cafe floor', accessKey: 'mg-t05-197e4a63b8d025cf' },
]

export const publicTable = ({ accessKey: _accessKey, ...table }) => table
