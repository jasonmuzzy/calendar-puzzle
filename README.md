# The Gift of Permutation Present

Join the fun on Reddit at https://www.reddit.com/r/adventofcode/comments/1m9bkwz/secret_santa_in_july/!

## Part 1

The elves are playing Secret Santa in July and you're invited!  You've been vacationing at the North Pole for the last couple of weeks, and the elves want to include you in one more fun activity before you leave.  

As all the elves gather around to draw names you swear you catch a mischievous twinkle in Santa's eye as you reach into the bag and pull out a tag that, sure enough, reads, "Santa."  What sort of mischief is he up to?

You head off to the workshop, where the rules state all gifts for this event must be made, and start brainstorming what you could gift the Jolly Old Elf.  You spot the laser cutter and engraver sitting unused, a tool that has drawn your curiosity lately, and quickly decide you'll make a laser-cut wooden calendar for Santa so he can keep a close eye on the critical Christmas schedule.

You decide to make it in two layers.  The bottom layer will have the weekdays, months and days 1 - 31 laser-engraved in a grid pattern.  The upper layer will form a raised lip (shown as `#`) around the grid.

    ###############################
    # Jan Feb Mar Apr May Jun #####
    # Jul Aug Sep Oct Nov Dec #####
    #   1   2   3   4   5   6   7 #
    #   8   9  10  11  12  13  14 #
    #  15  16  17  18  19  20  21 #
    #  22  23  24  25  26  27  28 #
    #  29  30  31 Sun Mon Tue Wed #
    ################# Thu Fri Sat #
    ###############################

After you cut the border out of the upper layer you're left with an oddly shaped piece, here shown with one `#` per space:

    ######
    ######
    #######
    #######
    #######
    #######
    #######
        ###

It'll be perfect to cut the puzzle pieces from!  You start by cutting out 3 windows (shown as `.`) that will allow today's date to show through, `Fri`, `Jul` and `25`:

    ######
    .#####
    #######
    #######
    #######
    ###.###
    #######
        #.#

Then you carve it up into 10 pieces numbered 0 through 9:

    000111
    .00151
    2222553
    2444853
    7488853
    749.863
    7799966
        9.6

You lay the pieces out on the workbench to examine them:

    000
     00
    
    111
    1 1
    
    2222
    2
    
    3
    3
    3
    3
    
    444
    4
    4
    
    5
    55
     5
     5
    
    6
    66
     6
    
    7
    7
    77
    
      8
    888
      8
    
    9
    999
      9

You don't want it to be too hard for Santa to solve so you wonder if there are multiple possible solutions for a single day.  After some trial-and-error you find another unique solution for `Fri Jul 25`:

    997778
     91178
    0991888
    0011444
    0066354
    266 354
    2222355
        3 5

That's good, there are at least 2 possible solutions for today, so that should make it easier on Santa, but how much easier you wonder.  You decide that all possible flips and rotations of a pieces that look the same count as one.  For example, piece `3` has only 2 unique variations:

    3333

and

    3
    3
    3
    3 

*How many unique possible solutions are there for `Fri Jul 25`?*

>!859!<


## Part 2

Wow!  That's a lot of solutions!  A wandering elf happens to pass by and sees your new puzzle, "Cool!  I get it!"  He then proceeds to rapidly solve it for one of the many other possible arrangements.  Hmm.  You forgot that elves have such quick minds and nimble fingers.  If you want to keep Santa from getting bored you'll want to challenge him to solve the puzzle for *every possible unique solution* from now until The Big Show on `Thu Dec 25`!

*How many valid unique solutions are there between now and The Big Show?*

>!293570!<