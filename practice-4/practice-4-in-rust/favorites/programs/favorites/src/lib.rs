use anchor_lang::prelude::*;

declare_id!("AHTQzuPoxEM8AnKorFWxX6DwUbswoPBRuLFHHrQ1FuYM");

// Anchor programs always use
pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[account]
#[derive(InitSpace)]
pub struct Favorites {
    pub number: u64,

    #[max_len(50)]
    pub color: String,
    pub authority: Option<Pubkey>,
}

// --- ACCOUNTS ---

#[derive(Accounts)]
pub struct SetFavorites<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: owner can be anyone
    pub owner: UncheckedAccount<'info>,

    #[account(
        init,
        payer = user,
        space = ANCHOR_DISCRIMINATOR_SIZE + Favorites::INIT_SPACE,
        seeds = [b"favorites", owner.key().as_ref()],
        bump,
    )]
    pub favorites: Account<'info, Favorites>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetFavoritesLegacy<'info> {
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

    /// CHECK: must match PDA seed
    pub owner: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"favorites", owner.key().as_ref()],
        bump,
    )]
    pub favorites: Account<'info, Favorites>,
}

#[derive(Accounts)]
pub struct SetAuthority<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: must match PDA seed
    pub owner: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"favorites", owner.key().as_ref()],
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

// --- PROGRAM ---

#[program]
pub mod favorites {
    use super::*;

    // Our instruction handler! It sets the user's favorite number and color
    pub fn set_favorites(
        context: Context<SetFavorites>,
        number: u64,
        color: String,
        authority: Option<Pubkey>
    ) -> Result<()> {
        let favorites = &mut context.accounts.favorites;
        favorites.number = number;
        favorites.color = color;
        favorites.authority = authority;
        Ok(())
    }
    

    pub fn set_favorites_legacy(context: Context<SetFavoritesLegacy>, number: u64, color: String) -> Result<()> {
        let favorites = &mut context.accounts.favorites;
        favorites.number = number;
        favorites.color = color;
        favorites.authority = None; 
        Ok(())
    }

    pub fn set_authority(context: Context<SetAuthority>, new_authority: Option<Pubkey>) -> Result<()> {
        let signer = context.accounts.user.key();
        let favorites = &mut context.accounts.favorites;

        if favorites.authority.is_none() {
            return Err(error!(ErrorCode::NoDelegateSupport));
        }

        if signer != context.accounts.owner.key()
            && Some(signer) != favorites.authority
        {
            return Err(error!(ErrorCode::Unauthorized));
        }

        favorites.authority = new_authority;
        Ok(())
    }

    pub fn update_favorites(
        context: Context<UpdateFavorites>,
        number: Option<u64>,
        color: Option<String>,
    ) -> Result<()> {
        let signer = context.accounts.user.key();
        let owner = context.accounts.owner.key();
        let favorites = &mut context.accounts.favorites;

        if let Some(auth) = favorites.authority {
            if signer != owner && signer != auth {
                return Err(error!(ErrorCode::Unauthorized));
            }
        } else if signer != owner {
            return Err(error!(ErrorCode::Unauthorized));
        }

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

// --- ERRORS ---

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Legacy account does not support delegate.")]
    NoDelegateSupport,
}
