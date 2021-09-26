// import assert from 'assert'
import {Service, Client} from '../index'

const testUnit = {
    [Symbol('Service.Start')] : async function() {
        const service  = new Service({
            partnerList:[]
        })
        const port = await service.start('0.0.0.0:8080')
        const client1 = new Client({address:'0.0.0.0:8080'})
        client1.keepNotify()
        client1.on('notify',(data)=>{
            console.log(data)
        })
        const client2 = new Client({address:'0.0.0.0:8080'})
        let i = 0;
        let timer2 = setInterval(async ()=>{
            await client2.sendNotify({hello:'world'+ i});
            i++;
            if(i>10){
                clearInterval(timer2)
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

