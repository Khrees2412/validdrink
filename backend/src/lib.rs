#![cfg_attr(not(feature = "export-abi"), no_main)]

#[global_allocator]
static ALLOC: mini_alloc::MiniAlloc = mini_alloc::MiniAlloc::INIT;

extern crate alloc;

use stylus_sdk::msg;
use stylus_sdk::{alloy_primitives::U256, prelude::*};
use alloy_primitives::Address;
use stylus_sdk::console;
use stylus_sdk::stylus_proc::entrypoint;
use stylus_sdk::storage::StorageString;
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

    #[view]
    pub fn get_user_balance(&self, user: Address) -> String {
        self.user_token_balances.get(user).to_string()
    }

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
        
        let mut pinned_name = Pin::new(&mut new_product.name);
        let mut pinned_barcode = Pin::new(&mut new_product.barcode);
        
        pinned_name.as_mut().push_str(name.as_str());
        pinned_barcode.as_mut().set_str(barcode.as_str());
        

        self.products.push(&new_product);
    }

    #[view] 
    pub fn is_valid_product(&self, barcode: String) -> bool {
        let product_count = self.products.len();
    
        for i in 0..product_count {
            if let Some(product) = self.products.get(i) {
                if product.barcode.get_string() == barcode {
                    return !product.is_fake;
                }
            }
        }
        false
    }

    // #[view]
    // pub fn get_product(&self, product_id: U256) -> U256 {
    //     self.products.get(product_id)
    // }

}