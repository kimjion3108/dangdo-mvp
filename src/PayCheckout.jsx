import React,{useEffect,useRef,useState} from 'react';
import {CheckCircle2,Gift,Minus,Plus,Coffee,ShoppingBag,Utensils,LoaderCircle} from 'lucide-react';
import {paymentQuote} from './journeyModel.js';
import './pay.css';
const money=n=>n.toLocaleString('ko-KR');
export default function PayCheckout({product,destination,wallet,quantity,setQuantity,coupon,setCoupon,error,onPay,onClose,Dialog}){
 const [agreed,setAgreed]=useState(false),[busy,setBusy]=useState(false);
 const timer=useRef(),locked=useRef(false);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const bill=paymentQuote(product,quantity,coupon),Icon=product.kind==='coffee'?Coffee:product.kind==='meal'?Utensils:ShoppingBag;
 const insufficient=bill.total>wallet.balance;
 function pay(){if(locked.current||!agreed||insufficient)return;locked.current=true;setBusy(true);timer.current=setTimeout(()=>{onPay();locked.current=false;setBusy(false);},700);}
 return <Dialog title="카카오페이 결제" onClose={()=>{if(!locked.current)onClose();}}><div className="pay-checkout" aria-busy={busy}>
  <div className="pay-brand"><span className="pay-speech"/>pay <span className="pay-demo">시연 결제</span></div>
  <div className="pay-product"><div className="pay-art"><Icon size={32}/></div><div><span>{product.merchant}</span><h3>{product.name}</h3><p>{destination} 도착 혜택</p></div></div>
  <div className="pay-quantity"><span>수량</span><div><button disabled={busy||quantity<=1} onClick={()=>setQuantity(n=>n-1)} aria-label="수량 줄이기"><Minus size={18}/></button><b>{quantity}</b><button disabled={busy||quantity>=3} onClick={()=>setQuantity(n=>n+1)} aria-label="수량 늘리기"><Plus size={18}/></button></div></div>
  <label className="pay-coupon"><input type="checkbox" checked={coupon} disabled={busy} onChange={e=>setCoupon(e.target.checked)}/><Gift size={20}/><span>도착 할인</span><b>−{money(product.discount*quantity)}원</b></label>
  <div className="pay-bill"><div><span>상품 금액</span><b>{money(bill.original)}원</b></div><div><span>도착 혜택 할인</span><b className="pay-yellow">−{money(bill.discount)}원</b></div><div className="pay-total"><b>결제할 금액</b><strong>{money(bill.total)}<small>원</small></strong></div></div>
  <div className="pay-method"><div className="pay-money">₩</div><div><strong>카카오페이머니</strong><span>체험 잔액 {money(wallet.balance)}원</span></div><CheckCircle2 size={22}/></div>
  <div className="pay-reward"><span>P</span><div><strong>{money(bill.reward)}P 적립 예정</strong><p>결제 금액의 1%   체험 포인트</p></div></div>
  <label className="pay-consent"><input type="checkbox" checked={agreed} disabled={busy} onChange={e=>setAgreed(e.target.checked)}/><span>상품과 할인 금액을 확인했어요</span></label>
  <p className="pay-notice">실제 돈이 결제되지 않는 구매 체험이에요.<br/>가상 상품이며 매장으로 주문이 전송되지 않아요.</p>
  {(error||insufficient)&&<p role="alert" className="pay-error">{error||'체험 잔액이 부족해요. 주문 내역을 확인해 주세요.'}</p>}
  <button className="pay-submit" disabled={!agreed||busy||insufficient} onClick={pay}>{busy?<><LoaderCircle size={22} className="spin"/>결제 확인 중</>:`${money(bill.total)}원 ${error?'다시 ':''}체험 결제`}</button>
 </div></Dialog>;
}
