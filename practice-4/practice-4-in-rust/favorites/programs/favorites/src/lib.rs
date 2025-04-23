use anchor_lang::prelude::*;

declare_id!("AHTQzuPoxEM8AnKorFWxX6DwUbswoPBRuLFHHrQ1FuYM");

// Anchor programs always use
pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

// What we will put inside the Favorites PDA
#[account]
#[derive(InitSpace)]
pub struct Favorites {
    pub number: u64,

    #[max_len(50)]
    pub color: String,
}

// When people call the set_favorites instruction, they will need to provide the accounts that will
// be modified. This keeps Solana fast!
#[derive(Accounts)]
pub struct SetFavorites<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = ANCHOR_DISCRIMINATOR_SIZE + Favorites::INIT_SPACE,
        seeds = [b"favorites", user.key().as_ref()],
        bump,
    )]
    pub favorites: Account<'info, Favorites>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateFavorites<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"favorites", user.key().as_ref()],
        bump,
    )]
    pub favorites: Account<'info, Favorites>,
}

// Accounts struct for getting favorites
#[derive(Accounts)]
pub struct GetFavorites<'info> {
    pub user: Signer<'info>,
    
    #[account(
        seeds = [b"favorites", user.key().as_ref()],
        bump,
    )]
    pub favorites: Account<'info, Favorites>,
}

// Our Solana program!
#[program]
pub mod favorites {
    use super::*;

    // Our instruction handler! It sets the user's favorite number and color
    pub fn set_favorites(context: Context<SetFavorites>, number: u64, color: String) -> Result<()> {
        let user_public_key = context.accounts.user.key();
        msg!("Greetings from {}", context.program_id);
        msg!(
            "User {}'s favorite number is {} and favorite color is: {}",
            user_public_key,
            number,
            color
        );

        context
            .accounts
            .favorites
            .set_inner(Favorites { number, color });
        Ok(())
    }

    // Instruction to update the user's favorite number and/or color
    pub fn update_favorites(context: Context<UpdateFavorites>, number: Option<u64>, color: Option<String>) ->Result<()> {
        let favorites = &mut context.accounts.favorites;

        if let Some(new_number) = number {
            favorites.number = new_number;
            msg!("Updated number to: {}", new_number);
        }

        if let Some(new_color) = color {
            favorites.color = new_color.clone();
            msg!("Updated color to: {}", new_color);
        }

        let user_public_key = context.accounts.user.key();
        msg!(
            "User {}'s favorite number is {} and favorite color is: {}",
            user_public_key,
            favorites.number,
            favorites.color
        );

        Ok(())
    }
    // We can also add a get_favorites instruction to get the user's favorite number and color
    pub fn get_favorites(context: Context<GetFavorites>) -> Result<Favorites> {
        let favorites = &context.accounts.favorites;
        let favorites_data = &**favorites; 
        msg!(
            "User {}'s favorite number is {} and favorite color is: {}",
            context.accounts.user.key(),
            favorites_data.number,
            favorites_data.color
        );
        Ok(favorites_data.clone())
    }
}
