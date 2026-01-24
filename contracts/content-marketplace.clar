;; USDCx Content Marketplace
;; A decentralized marketplace for monetizing digital content (APIs, datasets, AI models)
;; with programmable access control using USDCx payments

;; Error constants
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-insufficient-payment (err u103))
(define-constant err-already-inactive (err u104))
(define-constant err-transfer-failed (err u105))

;; Data variables
(define-data-var content-id-nonce uint u0)

;; Data maps
;; Store content listing information
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

;; Track user access rights with expiration
(define-map user-access
  { content-id: uint, user: principal }
  { expires-at-block: uint }
)

;; Track content statistics
(define-map content-stats
  { content-id: uint }
  {
    total-revenue: uint,
    access-count: uint
  }
)

;; Public functions

;; List new content for sale
;; @param price-per-access: Price in USDCx (micro-units, 6 decimals)
;; @param access-duration: Duration in blocks
;; @param metadata-uri: IPFS URI or metadata link
;; @returns: Content ID on success
(define-public (list-content (price-per-access uint) (access-duration uint) (metadata-uri (string-ascii 256)))
  (let
    (
      (new-content-id (+ (var-get content-id-nonce) u1))
    )
    ;; Store the listing
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
    
    ;; Initialize stats
    (map-set content-stats
      { content-id: new-content-id }
      {
        total-revenue: u0,
        access-count: u0
      }
    )
    
    ;; Increment nonce
    (var-set content-id-nonce new-content-id)
    
    ;; Return the new content ID
    (ok new-content-id)
  )
)

;; Purchase access to content using USDCx
;; @param content-id: ID of the content to access
;; @param payment-amount: Amount being paid in USDCx (must be >= price)
;; @returns: true on success
(define-public (purchase-access (content-id uint) (payment-amount uint))
  (let
    (
      (listing (unwrap! (map-get? content-listings { content-id: content-id }) err-not-found))
      (stats (unwrap! (map-get? content-stats { content-id: content-id }) err-not-found))
      (expires-at (+ block-height (get access-duration listing)))
      (creator (get creator listing))
    )
    ;; Validate listing is active
    (asserts! (get is-active listing) err-not-found)
    
    ;; Validate payment amount
    (asserts! (>= payment-amount (get price-per-access listing)) err-insufficient-payment)
    
    ;; Transfer USDCx from buyer to creator
    ;; Uses SIP-010 token standard transfer function
    (try! (contract-call? 'ST13T9VVWP9XHRHFMTSYPNDWN986AEK4WQ2DYQ0Q2.usdcx-mock transfer 
        payment-amount 
        tx-sender 
        creator 
        none))
    
    ;; Grant access
    (map-set user-access
      { content-id: content-id, user: tx-sender }
      { expires-at-block: expires-at }
    )
    
    ;; Update statistics
    (map-set content-stats
      { content-id: content-id }
      {
        total-revenue: (+ (get total-revenue stats) payment-amount),
        access-count: (+ (get access-count stats) u1)
      }
    )
    
    (ok true)
  )
)

;; Deactivate content listing
;; @param content-id: ID of the content to deactivate
;; @returns: true on success
(define-public (deactivate-content (content-id uint))
  (let
    (
      (listing (unwrap! (map-get? content-listings { content-id: content-id }) err-not-found))
    )
    ;; Only creator can deactivate
    (asserts! (is-eq tx-sender (get creator listing)) err-unauthorized)
    
    ;; Update listing to inactive
    (map-set content-listings
      { content-id: content-id }
      (merge listing { is-active: false })
    )
    
    (ok true)
  )
)

;; Read-only functions

;; Get content listing details
;; @param content-id: ID of the content
;; @returns: Listing details or none
(define-read-only (get-content-listing (content-id uint))
  (map-get? content-listings { content-id: content-id })
)

;; Check if user has valid access to content
;; @param content-id: ID of the content
;; @param user: Principal to check
;; @returns: true if user has valid access
(define-read-only (has-valid-access (content-id uint) (user principal))
  (match (map-get? user-access { content-id: content-id, user: user })
    access-info (<= block-height (get expires-at-block access-info))
    false
  )
)

;; Get content statistics
;; @param content-id: ID of the content
;; @returns: Stats (revenue and access count) or none
(define-read-only (get-content-stats (content-id uint))
  (map-get? content-stats { content-id: content-id })
)

;; Get current content ID nonce
(define-read-only (get-content-id-nonce)
  (var-get content-id-nonce)
)