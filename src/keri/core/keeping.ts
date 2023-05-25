import { Salter } from './salter'
import { Algos, SaltyCreator } from './manager';
import { MtrDex } from './matter';
import { Tier } from './salter';
import { Encrypter } from "../core/encrypter";
import { Decrypter } from './decrypter';
import {b} from "./core";
import { Cipher } from './cipher';
import { Diger } from './diger';

export {};

export class Manager {
    private salter?: Salter
    private externalModulees?: any

    constructor(salter: Salter, externalModules: any = null ) {

        this.salter = salter
        this.externalModulees = externalModules
    }

    new(algo: Algos, pidx: number, kargs: any){
        switch (algo) {
            case Algos.salty:
                return new SaltyKeeper(this.salter!, pidx, kargs)
                break
            case Algos.randy:
                throw new Error('Randy not allowed yet')
            case Algos.extern:
                throw new Error(`External modules not allowed yet` + this.externalModulees)
                break
            default:
                throw new Error('Unknown algo')
        }
    }

}

export class SaltyKeeper {
    private aeid:string
    private encrypter:Encrypter
    private decrypter:Decrypter
    // private salter: Salter
    private pidx:number
    private kidx:number
    private tier:Tier
    private transferable:boolean
    private stem:string | undefined
    private code:string
    private count:number
    private icodes:string[] | undefined
    private ncode:string
    private ncount:number
    private ncodes:string[] | undefined
    private dcode:string | undefined
    private sxlt:string | undefined
    private bran:string | undefined
    private creator: SaltyCreator

    constructor(salter:Salter, pidx:number, kidx:number=0, tier=Tier.low, transferable=false, stem=undefined,
        code=MtrDex.Ed25519_Seed, count=1, icodes:string[]|undefined=undefined, ncode=MtrDex.Ed25519_Seed,
        ncount=1, ncodes:string[]|undefined=undefined, dcode=MtrDex.Blake3_256, bran:string|undefined = undefined, sxlt=undefined){

        // # Salter is the entered passcode and used for enc/dec of salts for each AID
        let signer = salter.signer(undefined, transferable=false)

        this.aeid = signer.verfer.qb64

        this.encrypter = new Encrypter({}, b(this.aeid))
        this.decrypter = new Decrypter({}, signer.qb64b)

        this.code = code
        this.ncode = ncode
        this.tier = tier
        this.icodes = icodes==undefined? new Array<string>(count).fill(code) : icodes
        this.ncodes = ncodes==undefined? new Array<string>(ncount).fill(ncode) : ncodes
        this.dcode = dcode
        this.pidx = pidx
        this.kidx = kidx
        this.transferable = transferable
        this.count = count
        this.ncount = ncount
        this.stem = stem==undefined? "signify:aid" : stem
        
        if (bran != undefined) {
            this.bran = MtrDex.Salt_128 + 'A' + bran!.slice(0, 21)
            this.creator = new SaltyCreator(this.bran, this.tier, this.stem)
            this.sxlt = this.encrypter.encrypt(b(this.creator.salt)).qb64
        } else if (this.sxlt == undefined) {
            this.creator = new SaltyCreator(undefined, this.tier, this.stem)
            this.sxlt = this.encrypter.encrypt(b(this.creator.salt)).qb64
        } else {            
            this.sxlt = sxlt
            let ciph = new Cipher({qb64:this.sxlt})
            this.creator = new SaltyCreator(this.decrypter.decrypt(null, ciph).qb64, tier=tier, this.stem)
        }

    }

    params() {
        // Get AID parameters to store externally

        return {
            sxlt: this.sxlt,
            pidx: this.pidx,
            kidx: this.kidx,
            stem: this.stem,
            tier: this.tier,
            icodes: this.icodes,
            ncodes: this.ncodes,
            dcode: this.dcode,
            transferable: this.transferable
        }
    }

    incept(transferable:boolean) {
        // Create verfers and digers for inception event for AID represented by this Keeper

        // Args:
        //     transferable (bool): True if the AID for this keeper can establish new keys

        // Returns:
        //     verfers(list): qualified base64 of signing public keys
        //     digers(list): qualified base64 of hash of rotation public keys
        
        this.transferable = transferable
        this.kidx = 0

        let signers = this.creator.create(this.icodes, this.ncount, this.ncode, this.transferable, this.pidx, 0, this.kidx,false)                          
        let verfers = signers.signers.map(signer => signer.verfer.qb64);

        let nsigners = this.creator.create(this.ncodes, this.count, this.code, this.transferable, this.pidx, 0, this.icodes?.length,false)    
        let digers = nsigners.signers.map(nsigner => new Diger({code: this.dcode},nsigner.verfer.qb64b ).qb64);

        return [verfers, digers]

    }

    sign(ser: Uint8Array, indexed=true, indices=null, ondices=null){
        let signers = this.creator.create(this.icodes, this.ncount, this.ncode, this.transferable, this.pidx, 0, this.kidx,false)

        if (indexed){
            let sigers = []
            let i = 0
            for (const [j, signer] of signers.signers.entries()) {
                if (indices!= null){
                    i = indices![j]
                    if (typeof i != "number" || i < 0){
                        throw new Error(`Invalid signing index = ${i}, not whole number.`)
                    }
                } else {
                    i = j
                }
                let o = 0
                if (ondices!=null){
                    o = ondices![j]
                    if ((o == null || typeof o == "number" && typeof o != "number" && o>=0)!) {
                        throw new Error(`Invalid ondex = ${o}, not whole number.`)
                    }
                } else {
                    o = i
                }
                sigers.push(signer.sign(ser, i, o==null?true:false, o))
            } 
            return sigers.map(siger => siger.qb64);
        } else {
            let cigars = []
            for (const [_, signer] of signers.signers.entries()) {
                cigars.push(signer.sign(ser))
            }
            return cigars.map(cigar => cigar.qb64);
        }
    }
}