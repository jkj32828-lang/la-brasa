const P=[
 ['products/b1',{id:'b1',cat:'Mais Vendidos',name:'Baconese DB',desc:'Fraldinha 200g',price:30,tag:'🔥 Mais vendido',img:'',available:true,addons:true,pos:0}],
 ['products/b3',{id:'b3',cat:'Burgers Monstruosos',name:'Bacon Supreme',desc:'Fraldinha 200g, bacon',price:34.9,tag:'',img:'',available:true,addons:true,pos:1}],
 ['products/s1',{id:'s1',cat:'Porções Individuais',name:'Batata rústica pequena',desc:'Batata rústica',price:15.9,tag:'',img:'',available:true,addons:false,pos:2}],
 ['products/d1',{id:'d1',cat:'Bebidas',name:'Refrigerante Lata',desc:'Cola',price:7.9,tag:'',img:'',available:false,addons:false,pos:3}]];
const NOW=Date.now();
const ADDR={street:'Rua Augusto Spinelli',number:'92',complement:'',neighborhood:'Centro',city:'Nova Friburgo',state:'RJ',cep:'28610-190'};
const O1=['orders/o1',{id:'o1',code:'#4821',createdAt:NOW,status:'new',customer:{name:'<img src=x onerror="window.__xss=1">Mari',phone:'22 9'},address:ADDR,payment:'pix',items:[{pid:'b1',name:'Cheddar Duplo',qty:2,unit:30,addons:['Bacon'],obs:''}],subtotal:60,delivery:8.99,discount:3,total:65.99}];
const O2=['orders/o2',{id:'o2',code:'#3307',createdAt:NOW-86400e3,status:'ready',customer:{name:'João',phone:'22 8'},address:ADDR,payment:'card',items:[{pid:'s1',name:'Batata rústica pequena',qty:1,unit:15.9,addons:[],obs:''}],subtotal:15.9,delivery:8.99,discount:0,total:24.89}];
const CFGS={
 A:{seed:[...P,['orders/o_outro',{...O2[1],id:'o_outro'}]]},
 B:{seed:P},
 C:{site:'dono',owner:true,seed:[...P,O1,O2,['reviews/r1',{id:'r1',name:'Pedro',rating:5,text:'Ótimo',createdAt:NOW}],['messages/m1',{id:'m1',name:'Carla',contact:'c@x.com',body:'Oi',createdAt:NOW,read:false}]]},
 D:{failWrites:true,seed:P},
 E:{noDb:true,seed:P},
 F:{site:'dono',account:'outro@gmail.com',seed:[...P,O1]},
 G:{site:'dono',owner:true,seed:[]},
 H:{owner:true,seed:P},
 I:{site:'dono',owner:true,failWrites:true,seed:[...P,O1]},
 J:{cepDown:true,seed:P}};
