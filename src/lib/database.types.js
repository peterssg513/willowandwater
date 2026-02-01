/**
 * Database types for Willow & Water v2.0
 * 
 * These types mirror the Supabase database schema.
 * Use JSDoc for type hints in JavaScript.
 */

/**
 * @typedef {'prospect' | 'active' | 'paused' | 'churned'} CustomerStatus
 */

/**
 * @typedef {'lockbox' | 'garage_code' | 'hidden_key' | 'customer_home' | 'other'} AccessType
 */

/**
 * @typedef {'weekly' | 'biweekly' | 'monthly' | 'onetime'} Frequency
 */

/**
 * @typedef {'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'} PreferredDay
 */

/**
 * @typedef {'morning' | 'afternoon'} TimeSlot
 */

/**
 * @typedef {'pending' | 'active' | 'paused' | 'cancelled'} SubscriptionStatus
 */

/**
 * @typedef {'first_clean' | 'recurring' | 'one_time'} JobType
 */

/**
 * @typedef {'pending_payment' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'} JobStatus
 */

/**
 * @typedef {'pending' | 'deposit_paid' | 'paid' | 'failed' | 'refunded'} PaymentStatus
 */

/**
 * @typedef {'active' | 'inactive'} CleanerStatus
 */

/**
 * @typedef {'supplies' | 'equipment' | 'consumables' | 'other'} InventoryCategory
 */

/**
 * @typedef {'in_stock' | 'low_stock' | 'out_of_stock'} InventoryStatus
 */

/**
 * @typedef {'owner' | 'manager'} AdminRole
 */

/**
 * @typedef {'customer' | 'cleaner'} RecipientType
 */

/**
 * @typedef {'email' | 'sms'} CommunicationChannel
 */

/**
 * @typedef {'sent' | 'delivered' | 'failed' | 'bounced'} CommunicationStatus
 */

/**
 * @typedef {'deposit' | 'remaining' | 'recurring' | 'tip' | 'cancellation_fee' | 'refund'} PaymentType
 */

/**
 * @typedef {'call' | 'email' | 'internal' | 'complaint' | 'compliment'} NoteType
 */

/**
 * @typedef {'pending' | 'completed' | 'credited'} ReferralStatus
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} email
 * @property {string} phone
 * @property {string} name
 * @property {string} [address]
 * @property {string} [city]
 * @property {string} [zip]
 * @property {string} [service_area]
 * @property {number} [sqft]
 * @property {number} [bedrooms]
 * @property {number} [bathrooms]
 * @property {AccessType} [access_type]
 * @property {string} [access_instructions]
 * @property {CustomerStatus} status
 * @property {string} [stripe_customer_id]
 * @property {string} [referral_code]
 * @property {string} [referred_by_customer_id]
 * @property {number} credit_balance
 * @property {boolean} google_review_requested
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Subscription
 * @property {string} id
 * @property {string} customer_id
 * @property {Frequency} frequency
 * @property {PreferredDay} [preferred_day]
 * @property {TimeSlot} [preferred_time]
 * @property {number} base_price
 * @property {SubscriptionStatus} status
 * @property {string} [started_at]
 * @property {string} [paused_at]
 * @property {string} [cancelled_at]
 * @property {string} created_at
 */

/**
 * @typedef {Object} Cleaner
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string[]} service_areas
 * @property {CleanerStatus} status
 * @property {string} [hire_date]
 * @property {string} created_at
 */

/**
 * @typedef {Object} CleanerTimeOff
 * @property {string} id
 * @property {string} cleaner_id
 * @property {string} start_date
 * @property {string} end_date
 * @property {string} [reason]
 * @property {string} [created_by]
 * @property {string} created_at
 */

/**
 * @typedef {Object} Job
 * @property {string} id
 * @property {string} customer_id
 * @property {string} [subscription_id]
 * @property {string} [cleaner_id]
 * @property {string} scheduled_date
 * @property {TimeSlot} scheduled_time
 * @property {number} duration_minutes
 * @property {JobType} job_type
 * @property {number} base_price
 * @property {number} addons_price
 * @property {number} total_price
 * @property {number} discount_amount
 * @property {number} final_price
 * @property {number} [deposit_amount]
 * @property {string} [deposit_paid_at]
 * @property {string} [deposit_payment_intent_id]
 * @property {number} [remaining_amount]
 * @property {string} [remaining_paid_at]
 * @property {string} [remaining_payment_intent_id]
 * @property {number} tip_amount
 * @property {string} [tip_payment_intent_id]
 * @property {JobStatus} status
 * @property {PaymentStatus} payment_status
 * @property {string} [cleaner_started_at]
 * @property {string} [cleaner_completed_at]
 * @property {number} [actual_duration_minutes]
 * @property {number} [customer_rating]
 * @property {string} [customer_feedback]
 * @property {boolean} google_review_sent
 * @property {number} cancellation_fee
 * @property {string} [cancelled_at]
 * @property {string} [cancellation_reason]
 * @property {string} [special_instructions]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} AddonService
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} price
 * @property {number} duration_minutes
 * @property {boolean} is_active
 * @property {number} display_order
 * @property {string} created_at
 */

/**
 * @typedef {Object} JobAddon
 * @property {string} id
 * @property {string} job_id
 * @property {string} addon_service_id
 * @property {string} name
 * @property {number} price
 * @property {string} created_at
 */

/**
 * @typedef {Object} ActivityLog
 * @property {string} id
 * @property {string} entity_type
 * @property {string} entity_id
 * @property {string} action
 * @property {'customer' | 'admin' | 'system' | 'cleaner'} actor_type
 * @property {string} [actor_id]
 * @property {Object} details
 * @property {string} created_at
 */

/**
 * @typedef {Object} CustomerNote
 * @property {string} id
 * @property {string} customer_id
 * @property {NoteType} note_type
 * @property {string} content
 * @property {string} [created_by]
 * @property {string} created_at
 */

/**
 * @typedef {Object} CommunicationLog
 * @property {string} id
 * @property {RecipientType} recipient_type
 * @property {string} recipient_id
 * @property {string} recipient_contact
 * @property {CommunicationChannel} channel
 * @property {string} template
 * @property {string} [subject]
 * @property {string} content
 * @property {CommunicationStatus} status
 * @property {string} [external_id]
 * @property {string} [error_message]
 * @property {string} [related_entity_type]
 * @property {string} [related_entity_id]
 * @property {string} created_at
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} customer_id
 * @property {string} [job_id]
 * @property {number} amount
 * @property {PaymentType} payment_type
 * @property {string} [stripe_payment_intent_id]
 * @property {'pending' | 'succeeded' | 'failed' | 'refunded'} status
 * @property {string} created_at
 */

/**
 * @typedef {Object} CustomerCredit
 * @property {string} id
 * @property {string} customer_id
 * @property {number} amount
 * @property {string} reason
 * @property {string} [applied_to_job_id]
 * @property {string} [expires_at]
 * @property {string} created_at
 */

/**
 * @typedef {Object} Referral
 * @property {string} id
 * @property {string} referrer_customer_id
 * @property {string} referred_customer_id
 * @property {string} referral_code_used
 * @property {ReferralStatus} status
 * @property {number} credit_amount
 * @property {string} [credited_at]
 * @property {string} created_at
 */

/**
 * @typedef {Object} InventoryItem
 * @property {string} id
 * @property {string} name
 * @property {InventoryCategory} category
 * @property {number} quantity
 * @property {string} unit
 * @property {number} reorder_threshold
 * @property {number} reorder_quantity
 * @property {string} [purchase_url]
 * @property {number} [cost_per_unit]
 * @property {string} [last_restock_date]
 * @property {InventoryStatus} status
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} AdminUser
 * @property {string} id
 * @property {string} user_id
 * @property {AdminRole} role
 * @property {string} name
 * @property {string} email
 * @property {string} created_at
 */

// Export empty object for module compatibility
export default {};
