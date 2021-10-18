// import assert from 'assert'
import {Service, Client} from '../index'

const testUnit = {
    [Symbol('Service.Start')] : async function() {
        const service1  = new Service({
            partnerList:[]
        })
        await service1.start('0.0.0.0:8080')
        service1.setPartnerList(['0.0.0.0:8081'])
        const service2  = new Service({
            partnerList:['0.0.0.0:8080']
        })
        await service2.start('0.0.0.0:8081')
        const client1 = new Client({address:'0.0.0.0:8081'})
        client1.keepNotify((data)=>{
            console.log(data)
        })
        const client2 = new Client({address:'0.0.0.0:8080'})
        let i = 0;
        let timer2 = setInterval(async ()=>{
            await client2.sendNotify({hello:'world'+ i});
            i++;
            if(i>3){
                clearInterval(timer2)
                service1.tryShutdown()
                service2.forceShutdown()
            }
        },1000)
        
    },
}


async function run(testUnitList) {
    for(let testUnitValue of testUnitList) {
        for(let testFunc of Object.getOwnPropertySymbols(testUnitValue)) {
            await testUnitValue[testFunc]();
        }
    }
}
(async function() {
    await run([testUnit]);
})();

