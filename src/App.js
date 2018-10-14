import React, {Component} from 'react'
import SimpleStorageContract from '../contracts/SimpleStorage.sol'
import getWeb3 from './util/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

//ipfs

import ipfsAPI from 'ipfs-api';
var ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'});
var simpleStorageInstance
var account
var counts
let saveImageOnIpfs = (reader) => {
    return new Promise(function(resolve, reject) {
        const buffer = Buffer.from(reader.result);
        ipfs.add(buffer).then((response) => {
            console.log(response)

            resolve(response[0].hash);
        }).catch((err) => {
            console.error(err)

            reject(err);
        })

    })
}

let SaveOnIPFS = (text) => {
    return new Promise(function(reslove, reject) {
        //
        var str = Buffer.from(text, 'utf-8');
        console.log(str);
        if (str.length) {
            ipfs.add(str).then((response) => {
                reslove(response[0].hash);

            })
        } else {
            reject()
        }

    })

}

let Utf8ArrayToStr = (array) => {
    var out,
        i,
        len,
        c;
    var char2,
        char3;

    out = "";
    len = array.length;
    i = 0;
    while (i < len) {
        c = array[i++];
        switch (c >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12:
            case 13:
                // 110x xxxx   10xx xxxx
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
                break;
            default:
                break;
        }
    }

    return out;
}

class App extends Component {
    constructor(props) {
        super(props)

        this.state = {

            storageValue: 0,
            web3: null,
            str: null,
            imgehashs: []
        }
    }

    componentWillMount() {
        // Get network provider and web3 instance.
        // See utils/getWeb3 for more info.

        getWeb3.then(results => {
            this.setState({web3: results.web3})

            // Instantiate contract once web3 provided.
            this.instantiateContract()
        }).catch(() => {
            console.log('Error finding web3.')
        })
    }

    instantiateContract() {
        /*
         * SMART CONTRACT EXAMPLE
         *
         * Normally these functions would be called in the context of a
         * state management library, but for convenience I've placed them here.
         */

        const contract = require('truffle-contract')
        const simpleStorage = contract(SimpleStorageContract)
        simpleStorage.setProvider(this.state.web3.currentProvider)

        // Declaring this for later so we can chain functions on SimpleStorage.

        // Get accounts.
        this.state.web3.eth.getAccounts((error, accounts) => {
            simpleStorage.deployed().then((instance) => {
                simpleStorageInstance = instance
                account = accounts[0];
                // Stores a given value, 5 by default.

                // return simpleStorageInstance.set(5, {from: accounts[0]})
                console.log(simpleStorageInstance);
            }).then((result) => {
                // Get the value from the contract to prove it worked.
                // return simpleStorageInstance.get.call(accounts[0])
                return simpleStorageInstance.getData(0, {from: accounts[0]})

            }).then((result) => {
                // Update state with the result.
                // return this.setState({storageValue: result.c[0]})
                console.log(result[0].c[0]);
                //有多个呀
                var count = result[0].c[0];
                var tempArray = this.state.imgehashs;
                var that = this

                for (var i = 1; i < count; i++) {
                    (function(i) {
                        simpleStorageInstance.getData(i, {from: accounts[0]}).then((result) => {
                            tempArray.push(result[1]);
                            console.log(tempArray);
                            counts = i;
                            that.setState({imgehashs: tempArray})
                        })
                    }(i))

                }

            })
        })
    }

    render() {
        let images = this.state.imgehashs.map((hash, index) => {
            return <div key={index} style={{backgroundColor: "gray",marginTop: 20}}>
        <img src={"http://localhost:8080/ipfs/" + hash} alt={index} style={{margin: 20,width: 200,height: 200}}/>
            </div>
        })

        console.log(images);

        return (<div className="App">
            <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">我的区块链相册 ,保存图片到ipfs,图片hash保存到eth区块链</a>
        </nav>

        <main className="container">
            <div className="pure-g">

            <div style={{marginTop: 30}}>
    <input ref="input_1" type="file" multiple="multiple"/>

            <button onClick={() => {
            var imgs = this.refs.input_1.files

            var reader = new FileReader();
            reader.readAsArrayBuffer(imgs[0])
            reader.onloadend = (e) => {
                console.log("图片hash来了");
                saveImageOnIpfs(reader).then(respon => {
                    console.log(respon);
                    //加载图片了
                    //把hash存到区块链
                    counts += 1
                    simpleStorageInstance.addData(respon, {from: this.state.web3.eth.accounts[0]}).then(() => {
                        simpleStorageInstance.getData(counts).then((result) => {
                            console.log("区块链");
                            console.log(result);
                            var tempArray = this.state.imgehashs;
                            tempArray.push(result[1]);
                            this.setState({imgehash: tempArray})
                        })

                    })

                })
            }

        }}>提交</button>

        <div id="imges" style={{
            display: "flex",
                flexDirection: 'row'
        }}>
        {images}
    </div>

        </div>

        </div>
        </main>
        </div>);
    }
}
export default App;

