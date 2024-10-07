// Conditionally compile the program without a main function, unless "export-abi" feature is enabled.
#![cfg_attr(not(feature = "export-abi"), no_main)]

// Set up a global memory allocator using MiniAlloc for efficient memory management in the smart contract.
#[global_allocator]
static ALLOC: mini_alloc::MiniAlloc = mini_alloc::MiniAlloc::INIT;

// Import the alloc crate to enable heap allocations in a no-std environment.
extern crate alloc;


// Import necessary types and functions from the Stylus SDK and Alloy Primitives crates.
// These include U256 for large integers, Address for user addresses, and various
// storage types for managing data on the blockchain.

use stylus_sdk::msg;
use stylus_sdk::{alloy_primitives::U256, prelude::*};
use alloy_primitives::Address;
use stylus_sdk::console;
// use std::convert::TryInto;
use stylus_sdk::stylus_proc::entrypoint;
use stylus_sdk::storage::{StorageString};
use std::pin::Pin;

// , StorageU256


pub struct Product {
    pub id: u64,
    pub name: String,
    pub barcode: StorageString,
    pub is_fake: bool,
}

impl Erase for Product {
    fn erase(&mut self) {
        todo!()
    }
}

impl<'a> From<Product> for &'a Product {
    fn from(product: Product) -> Self {
        // Convert Restaurant to &'a Restaurant
        Box::leak(Box::new(product))
    }
}

impl<'a> SimpleStorageType<'a> for Product {
    fn set_by_wrapped(&mut self, value: Self::Wraps<'a>) {
        let _ = value;
        todo!()
    }
    // Implement the required methods here
}

impl StorageType for Product {
    fn load<'a>(self) -> Self::Wraps<'a> {
        // Implement the load method
        todo!()
    }
    
    type Wraps<'a> = &'a Product
    where
        Self: 'a;
    
    type WrapsMut<'a> = &'a mut Product
    where
        Self: 'a;
    
    unsafe fn new(_slot: U256, _offset: u8) -> Self {
        todo!()
    }
    
    fn load_mut<'s>(self) -> Self::WrapsMut<'s>
    where
        Self: 's {
        todo!()
    }
    
    const SLOT_BYTES: usize = 32;
    
    const REQUIRED_SLOTS: usize = 0;
}

sol_storage! {
    #[entrypoint]
    pub struct SafeSip {
        address owner;
        bool active;
        mapping(address => uint256) user_token_balances;
        Product[] products;
        mapping(uint256 => uint256) product_votes;
        uint256 voting_period_end;
        uint256 token_price;
    }
}

#[external]
impl SafeSip {
    pub fn owner(&self) -> Address {
        self.owner.get()
    }

    pub fn is_active(&self) -> bool {
        self.active.get()
    }

    pub fn constructor(&mut self, token_price: U256) {
        self.owner.set(msg::sender());
        self.active.set(true);
        self.token_price.set(token_price);
    }

    #[view]
    pub fn get_user_balance(&self, user: Address) -> String {
        self.user_token_balances.get(user).to_string()
    }

    #[payable]
    pub fn purchase_tokens(&mut self) {
        let caller = msg::sender();
        let payment = msg::value();
        let token_price = self.token_price.get();

        //Calculates the no. of tokens to purchase
        let tokens_to_buy = payment / token_price;

        if tokens_to_buy == U256::ZERO {
            panic!("Insufficient payment to buy tokens");
        }

        let current_balance = self.user_token_balances.get(caller);
        let new_balance = current_balance + tokens_to_buy;
        self.user_token_balances.insert(caller, new_balance);
    }

    // pub fn vote(&mut self, product_id: U256, tokens: U256) {
    //     let caller = msg::sender();
    //     let mut user_balance = self.user_token_balances.get(caller);
    //     if user_balance < tokens {
    //         panic!("Insufficient tokens");
    //     }

    //     user_balance -= tokens;
    //     self.user_token_balances.insert(caller, user_balance);
    
    //     let mut restaurant_votes = self.restaurant_votes.get(restaurant_id);
    //     restaurant_votes += tokens;
    //     self.restaurant_votes.insert(restaurant_id, restaurant_votes);

    //     let restaurant_id_u64: u64 = restaurant_id.try_into().unwrap_or_else(|_| panic!("Product ID too large for u64"));
    //     let restaurant = self.products.get_mut(restaurant_id_u64 as usize).expect("Product not found");
        
    //     // unsafe {
    //     //     restaurant.total_votes = *StorageU256::new(total_votes, 0);
    //     // }
    // }

    pub fn add_product(&mut self, product_id: u64, name: String, barcode: String, is_fake: bool) {
        if msg::sender() != self.owner() {
            panic!("Only the owner can add products");
        }

        let mut new_product = Product {
            id: product_id.clone(),
            name: name.clone(),
            barcode: unsafe { StorageString::new(U256::from(0), 0) },
            is_fake
        };
        
        // Pin the StorageStrings and set their values
        let mut pinned_name = Pin::new(&mut new_product.name);
        let mut pinned_barcode = Pin::new(&mut new_product.barcode);
        
        // Assuming there's a method to set the value on a pinned StorageString
        // The actual method name might be different, please check the SDK documentation
        
        pinned_name.as_mut().push_str(name.as_str());
        pinned_barcode.as_mut().set_str(barcode.as_str());
        

        self.products.push(&new_product);
    }

    #[view]
    
    pub fn is_valid_product(&self, barcode: String) -> bool {
        // Loop through the products using an index
        let product_count = self.products.len();  // Get the number of products
    
        for i in 0..product_count {
            if let Some(product) = self.products.get(i) {
                // Compare the barcode strings
                if product.barcode.get_string() == barcode {
                    // Return true if the product is found and not fake
                    return !product.is_fake;
                }
            }
        }
        // Return false if no matching product is found
        false
    }

    // #[view]
    // pub fn get_product(&self, product_id: U256) -> U256 {
    //     self.products.get(product_id)
    // }

}