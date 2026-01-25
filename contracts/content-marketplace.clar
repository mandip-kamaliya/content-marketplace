;; USDCx Content Marketplace v8
;; A decentralized marketplace for monetizing digital content

;; Error constants
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-insufficient-payment (err u103))
(define-constant err-transfer-failed (err u105))

;; Data variables
(define-data-var content-id-nonce uint u0)

;; Data maps
(define-map content-listings
  { content-id: uint }
  {
    creator: principal,
    price-per-access: uint,
    access-duration: uint,
    is-active: bool,
    metadata-uri: (string-ascii 256)
  }
)

(define-map user-access
  { content-id: uint, user: principal }
  { expires-at-block: uint }
)

;; Public functions

(define-public (list-content (price-per-access uint) (access-duration uint) (metadata-uri (string-ascii 256)))
  (let
    (
      (new-content-id (+ (var-get content-id-nonce) u1))
    )
    (map-set content-listings
      { content-id: new-content-id }
      {
        creator: tx-sender,
        price-per-access: price-per-access,
        access-duration: access-duration,
        is-active: true,
        metadata-uri: metadata-uri
      }
    )
    (var-set content-id-nonce new-content-id)
    (ok new-content-id)
  )
)

(define-public (purchase-access (content-id uint) (payment-amount uint))
  (let
    (
      (listing (unwrap! (map-get? content-listings { content-id: content-id }) err-not-found))
      (expires-at (+ block-height (get access-duration listing)))
      (creator (get creator listing))
      (price (get price-per-access listing))
    )
    (asserts! (get is-active listing) err-not-found)
    (asserts! (>= payment-amount price) err-insufficient-payment)
    
    ;; Transfer USDCx
    ;; Hardcoded mock token address
    (try! (contract-call? 'ST13T9VVWP9XHRHFMTSYPNDWN986AEK4WQ2DYQ0Q2.usdcx-mock transfer 
        payment-amount 
        tx-sender 
        creator 
        none))
    
    (map-set user-access
      { content-id: content-id, user: tx-sender }
      { expires-at-block: expires-at }
    )
    
    (ok true)
  )
)

(define-read-only (get-content-listing (content-id uint))
  (map-get? content-listings { content-id: content-id })
)

(define-read-only (has-valid-access (content-id uint) (user principal))
  (match (map-get? user-access { content-id: content-id, user: user })
    access-info (<= block-height (get expires-at-block access-info))
    false
  )
)

(define-public (deactivate-content (content-id uint))
    (ok true) ;; Simplified for demo
)