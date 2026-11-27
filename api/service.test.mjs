import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import { servicePayload, serviceAction, kitchenTransition, updateServiceSettings } from './service.mjs'
const coreContext = { globalThis:{} }
vm.runInNewContext(await readFile(new URL('../CRM/dist/service-core.js',import.meta.url),'utf8'),coreContext)
const core=coreContext.globalThis.ServiceAlertCore
const owner={id:1,name:'Owner',role:'Owner'}, waiter={id:2,name:'Waiter',role:'Floor Staff'}
const clock=Date.parse('2026-11-27T14:00:00Z')
const order={id:1,status:'Kitchen',table:'Table 4',sentAt:new Date(clock-14*60000).toISOString(),createdAt:new Date(clock-14*60000).toISOString(),items:[{name:'Coffee',quantity:2}]}
const state=()=>({orders:[structuredClone(order)],reservations:[],staff:[],settings:{}})
test('delay boundary and floor filtering use server time and configurable limits',()=>{
  const s=state()
  assert.equal(servicePayload(s,owner,clock).orders[0].delayed,false)
  assert.equal(servicePayload(s,owner,clock+60000).orders[0].delayed,true)
  assert.equal(servicePayload(s,waiter,clock).orders.length,0)
  updateServiceSettings(s,{prepMinutes:20,readyMinutes:3})
  assert.equal(servicePayload(s,owner,clock+60000).orders[0].delayed,false)
  s.orders[0].status='Ready';s.orders[0].readyAt=new Date(clock-3*60000).toISOString()
  assert.equal(servicePayload(s,waiter,clock).orders[0].delayed,true)
  assert.throws(()=>updateServiceSettings(s,{prepMinutes:0,readyMinutes:3}))
})
test('ready timestamps stay stable, served tickets cannot return to kitchen',()=>{
  const s=state(), o=s.orders[0]
  assert.throws(()=>kitchenTransition(o,'Ready'),/Cannot move/)
  kitchenTransition(o,'Preparing');kitchenTransition(o,'Ready')
  const readyAt=o.readyAt
  kitchenTransition(o,'Ready')
  assert.equal(o.readyAt,readyAt)
  serviceAction(s,1,'accept',waiter,{readyAt})
  assert.equal(o.serviceAcceptedBy.id,2)
  assert.throws(()=>serviceAction(s,1,'accept',{id:3,name:'Another',role:'Floor Staff'}),/already handling/)
  serviceAction(s,1,'served',waiter,{readyAt})
  assert.equal(o.status,'Served')
  assert.equal(servicePayload(s,waiter).orders.length,0)
  assert.throws(()=>kitchenTransition(o,'Ready'),/Cannot move/)
})
test('initial backlog stays quiet, fresh orders alert once through preparation',()=>{
  const seen=new Set(), snapshot={orders:[{...order,delayed:true}]}
  assert.equal(core.detect(snapshot,'Kitchen',seen,false).length,0)
  assert.equal(core.detect(snapshot,'Kitchen',seen,true).length,0)
  const fresh={...order,id:2,sentAt:'2026-11-27T14:00:00Z',delayed:false}
  snapshot.orders.push(fresh)
  assert.equal(core.detect(snapshot,'Kitchen',seen,true)[0].kind,'new')
  fresh.status='Preparing'
  assert.equal(core.detect(snapshot,'Kitchen',seen,true).length,0)
  fresh.delayed=true
  assert.equal(core.detect(snapshot,'Kitchen',seen,true)[0].kind,'delay')
  assert.equal(core.detect(snapshot,'Kitchen',seen,true).length,0)
})
test('waiter ready/late alerts deduplicate across claims and browser refresh',()=>{
  const seen=new Set()
  core.detect({orders:[]},'Floor Staff',seen,false)
  const ready={...order,status:'Ready',readyAt:'2026-11-27T14:00:00Z',delayed:false}
  assert.equal(core.detect({orders:[ready]},'Floor Staff',seen,true)[0].kind,'ready')
  ready.acceptedBy={id:2,name:'Waiter'}
  assert.equal(core.detect({orders:[ready]},'Floor Staff',seen,true).length,0)
  const restored=new Set([...seen])
  assert.equal(core.detect({orders:[ready]},'Floor Staff',restored,true).length,0)
  ready.delayed=true
  assert.equal(core.detect({orders:[ready]},'Floor Staff',restored,true)[0].kind,'delay')
  assert.equal(core.detect({orders:[ready]},'Kitchen',new Set(),true).length,0)
})
