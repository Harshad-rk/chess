var UserMove = {};
UserMove.from = SQUARES.NO_SQ;
UserMove.to = SQUARES.NO_SQ;

var MirrorFiles = [ FILES.FILE_H, FILES.FILE_G, FILES.FILE_F, FILES.FILE_E, FILES.FILE_D, FILES.FILE_C, FILES.FILE_B, FILES.FILE_A ];
var MirrorRanks = [ RANKS.RANK_8, RANKS.RANK_7, RANKS.RANK_6, RANKS.RANK_5, RANKS.RANK_4, RANKS.RANK_3, RANKS.RANK_2, RANKS.RANK_1 ];

function MIRROR120(sq) {
	var file = MirrorFiles[FilesBrd[sq]];
	var rank = MirrorRanks[RanksBrd[sq]];
	return FR2SQ(file,rank);
}

$("#SetFen").click(function () {
	var fenStr = $("#fenIn").val();	
	ParseFen(fenStr);
	//PrintBoard();		
	SetInitialBoardPieces();	
	GameController.PlayerSide = brd_side;	
	CheckAndSet();	
	EvalPosition();	
	//PerftTest(5);
	//newGameAjax();	 
});

function CheckResult() {

    if (brd_fiftyMove > 100) {
     $("#GameStatus").text("GAME DRAWN {fifty move rule}"); 
     return BOOL.TRUE;
    }

    if (ThreeFoldRep() >= 2) {
     $("#GameStatus").text("GAME DRAWN {3-fold repetition}"); 
     return BOOL.TRUE;
    }
	
	if (DrawMaterial() == BOOL.TRUE) {
     $("#GameStatus").text("GAME DRAWN {insufficient material to mate}"); 
     return BOOL.TRUE;
    }
	
	//console.log('Checking end of game');
	GenerateMoves();
      
    var MoveNum = 0;
	var found = 0;
	for(MoveNum = brd_moveListStart[brd_ply]; MoveNum < brd_moveListStart[brd_ply + 1]; ++MoveNum)  {	
       
        if ( MakeMove(brd_moveList[MoveNum]) == BOOL.FALSE)  {
            continue;
        }
        found++;
		TakeMove();
		break;
    }
    
    $("#currentFenSpan").text(BoardToFen()); 
	
	if(found != 0) return BOOL.FALSE;
	var InCheck = SqAttacked(brd_pList[PCEINDEX(Kings[brd_side],0)], brd_side^1);
	//console.log('No Move Found, incheck:' + InCheck);
	
	if(InCheck == BOOL.TRUE)	{
	    if(brd_side == COLOURS.WHITE) {
	      $("#GameStatus").text("GAME OVER {black mates}");return BOOL.TRUE;
        } else {
	      $("#GameStatus").text("GAME OVER {white mates}");return BOOL.TRUE;
        }
    } else {
      $("#GameStatus").text("GAME DRAWN {stalemate}");return BOOL.TRUE;
    }	
    //console.log('Returning False');
	return BOOL.FALSE;	
}

function ClickedSquare(pageX, pageY) {
	var position = $("#Board").position();
	//console.log("Piece clicked at " + pageX + "," + pageY + " board top:" + position.top + " board left:" + position.left);
	
	var workedX = Math.floor(position.left);
	var workedY = Math.floor(position.top);
	var pageX = Math.floor(pageX);
	var pageY = Math.floor(pageY);
	
	var file = Math.floor((pageX-workedX) / 60);
	var rank = 7 - Math.floor((pageY-workedY) / 60);
	
	var sq = FR2SQ(file,rank);
	
	
	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}
	
	//console.log("WorkedX: " + workedX + " WorkedY:" + workedY + " File:" + file + " Rank:" + rank);
	//console.log("clicked:" + PrSq(sq));	
	
	SetSqSelected(sq); // must go here before mirror
	
	return sq;

}

function CheckAndSet() {
	if(CheckResult() != BOOL.TRUE) {
		GameController.GameOver = BOOL.FALSE;
		$("#GameStatus").text('');		
	} else {
		GameController.GameOver = BOOL.TRUE;
		GameController.GameSaved = BOOL.TRUE; // save the game here
	}
	//var fenStr = BoardToFen();
	 $("#currentFenSpan").text(BoardToFen());
	 
	 
	 
}

function PreSearch() {
		
		if(GameController.GameOver != BOOL.TRUE) {				
			srch_thinking = BOOL.TRUE;
			$('#ThinkingImageDiv').append('<image src="images/think3.png" id="ThinkingPng"/>')
			setTimeout( function() {StartSearch(); }, 200);
		}
}

function MakeUserMove() {
	if(UserMove.from != SQUARES.NO_SQ && UserMove.to != SQUARES.NO_SQ) {
		//console.log("User Move:" + PrSq(UserMove.from) + PrSq(UserMove.to));
		
		var parsed = ParseMove(UserMove.from,UserMove.to);
		
		DeselectSq(UserMove.from);
		DeselectSq(UserMove.to);
		
		//console.log("Parsed:" + parsed);
		
		if(parsed != NOMOVE) {
			MakeMove(parsed);
			MoveGUIPiece(parsed);
			CheckAndSet();
			PreSearch();
		}
		
		UserMove.from = SQUARES.NO_SQ;
		UserMove.to = SQUARES.NO_SQ; 	
	}
}




function UserColor() { // Is used to check which color the opponent has
		var MoveString = BoardToFen();
       $.ajax({
			type:'POST',
			url:'../GetColor.php',
			data:{MoveString:MoveString},
			dataType:'json',
			cache: false,
			success:function(data){
				//alert(data.msg);
				if (data.msg == "white"){
					$usercolor=0;
				} else{
					
					$usercolor=1;
				}
			}
        });
return $usercolor;
}

flipGameOnceIfBlack();
function flipGameOnceIfBlack() {
	var MoveString = BoardToFen();
       $.ajax({
			type:'POST',
			url:'../GetColor.php',
			data:{MoveString:MoveString},
			dataType:'json',
			cache: false,
			success:function(data){
				//alert(data.msg);
				if (data.msg == "white"){
					$usercolor=0;
				} else{
					GameController.BoardFlipped ^= 1;
					//console.log("Flipped:" + GameController.BoardFlipped);
					SetInitialBoardPieces();
					$usercolor=1;
				}
			}
        });
}

function MakeUserMove2() {
	$colorplayer=UserColor();
	// if (colorplayer==1 and GameController.PlayerSide ==1) or (colorplayer==0 and GameController.PlayerSide ==0)then do everything

	if(UserMove.from != SQUARES.NO_SQ && UserMove.to != SQUARES.NO_SQ) {
		
		//console.log("User Move:" + PrSq(UserMove.from) + PrSq(UserMove.to));
		
		var parsed = ParseMove(UserMove.from,UserMove.to);
		
		DeselectSq(UserMove.from);
		DeselectSq(UserMove.to);

		console.log("Parsed:" + parsed);
		if (parsed != 0) {
        moves =  PrSq(UserMove.from) + PrSq(UserMove.to)
			console.log("realmove"+ moves)}
		//alert("before: color " +$colorplayer+" brdside" +brd_side); 
		if(parsed != NOMOVE && (($colorplayer==0 && brd_side ==0) || ($colorplayer==1 && brd_side ==1))) {
			MakeMove(parsed);
			MoveGUIPiece(parsed);
			
			CheckAndSet();
			/* 
				PreSearch(); Only when playing against computer
				When a move is made we need to change the move condition to 
				the opponent
				White gives brd_side = 1, black gives brd_side = 0 
			*/
			
			GameController.PlayerSide = brd_side;	
			//alert("inside after color " +$colorplayer+" brdside" +brd_side); 
			//alert(brd_side); 
		} else {
			if(parsed != NOMOVE){
				GameController.PlayerSide = brd_side;	
			}
		}
		UserMove.from = SQUARES.NO_SQ;
		UserMove.to = SQUARES.NO_SQ; 
		//alert("outside: color " +$colorplayer+" brdside" +brd_side); 
		//---------------------------------------------------------
		//Nytt		
		var MoveString = BoardToFen();
				$.ajax({
					type:'POST',
					url:'../InsertMove.php',
					data:{MoveString:MoveString},
					dataType:'json',
					success:function(data){
						//alert(data.msg);
						
				}
		})
				
		//---------------------------------------------------------
		}
			

}
var timesRun = 0;
var startTime = new Date().getTime();

var timesRun = 0;
var startTime = new Date().getTime();
var MoveString = BoardToFen();
function loadLMove(){ 
		
       $.ajax({
			type:'POST',
			url:'../DisplayMove.php',
			data:{MoveString:MoveString},
			dataType:'json',
			cache: false,
			//timeout: 20000,
			success:function(data){
				if (data.msg != ""){
                    if (MoveString!=data.msg){
						var now = new Date().getTime();
						//alert(data.msg);
						ParseFen(data.msg);

						++timesRun;
						 console.log('Move displayed: ' + data.msg + 'Action ' + timesRun + ' started ' + (now - startTime) + 'ms after script start');
						//PrintBoard();	

						SetInitialBoardPieces();	
						GameController.PlayerSide = brd_side;	
						CheckAndSet();	
						
						EvalPosition();	
						//PerftTest(5);
						//newGameAjax();
						MoveString=data.msg;
						}
				} else{
                    if (MoveString!=data.msg){
						ParseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
						//PrintBoard();		
						SetInitialBoardPieces();	
						GameController.PlayerSide = brd_side;	
						CheckAndSet();	
						
						EvalPosition();	
						//PerftTest(5);
						//newGameAjax();
                    }
				}
			}
        });
		
}
//---------------------------------------------------------
loadLMove();
setInterval(loadLMove,2000);
//---------------------------------------------------------



$(document).on('click','.Piece', function (e) {	
	//console.log("Piece Click");
	if(srch_thinking == BOOL.FALSE && GameController.PlayerSide == brd_side) {
		if(UserMove.from == SQUARES.NO_SQ) 
			UserMove.from = ClickedSquare(e.pageX, e.pageY);
		else 
			UserMove.to = ClickedSquare(e.pageX, e.pageY);	
		
		MakeUserMove2();	
		
		
	 
	}	
});



$(document).on('click','.Square', function (e) {	
	//console.log("Square Click");
	if(srch_thinking == BOOL.FALSE && GameController.PlayerSide == brd_side && UserMove.from != SQUARES.NO_SQ) {
		UserMove.to = ClickedSquare(e.pageX, e.pageY);
		MakeUserMove2();
		//alert("hi");
		
		
		
	 
	 
	}
});

function RemoveGUIPiece(sq) {
	//console.log("remove on:" + PrSq(sq));
	$( ".Piece" ).each(function( index ) {
		 //console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
		 if( (RanksBrd[sq] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[sq] == Math.round($(this).position().left/60)) ){		
		 	//console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );	
			$(this).remove();			
		 }
		});
}

function AddGUIPiece(sq,pce) {	
	var rank = RanksBrd[sq];
	var file = FilesBrd[sq];
	var rankName = "rank" + (rank + 1);	
	var fileName = "file" + (file + 1);	
	pieceFileName = "images/" + SideChar[PieceCol[pce]] + PceChar[pce].toUpperCase() + ".png";
	imageString = "<image src=\"" + pieceFileName + "\" class=\"Piece clickElement " + rankName + " " + fileName + "\"/>";
	//console.log("add on " + imageString);
	$("#Board").append(imageString);
}

function MoveGUIPiece(move) {
	var from = FROMSQ(move);
	var to = TOSQ(move);
	
	var flippedFrom = from;
	var flippedTo = to;
	var epWhite = -10;
	var epBlack = 10;
	
	if(GameController.BoardFlipped == BOOL.TRUE) {
		flippedFrom = MIRROR120(from);
		flippedTo = MIRROR120(to);
		epWhite = 10;
		epBlack = -10;
	}
	
	if(move & MFLAGEP) {	
		var epRemove;			
		if(brd_side == COLOURS.BLACK) {
			epRemove = flippedTo + epWhite;
		} else {
			epRemove = flippedTo + epBlack;
		}
		//console.log("en pas removing from " + PrSq(epRemove));
		RemoveGUIPiece(epRemove);
	} else if(CAPTURED(move)) {
		RemoveGUIPiece(flippedTo);
	}
	
	var rank = RanksBrd[flippedTo];
	var file = FilesBrd[flippedTo];
	var rankName = "rank" + (rank + 1);	
	var fileName = "file" + (file + 1);
	
	/*if(GameController.BoardFlipped == BOOL.TRUE) {
		rankName += "flip";
		fileName += "flip";
	}*/
	
	$( ".Piece" ).each(function( index ) {
     //console.log( "Picture:" + index + ": " + $(this).position().top + "," + $(this).position().left );
     if( (RanksBrd[flippedFrom] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[flippedFrom] == Math.round($(this).position().left/60)) ){
     	//console.log("Setting pic ff:" + FilesBrd[from] + " rf:" + RanksBrd[from] + " tf:" + FilesBrd[to] + " rt:" + RanksBrd[to]);
     	$(this).removeClass();
     	$(this).addClass("Piece clickElement " + rankName + " " + fileName);     
     }
    });
    
    if(move & MFLAGCA) {  
    	if(GameController.BoardFlipped == BOOL.TRUE) {  	
			switch (to) {
				case SQUARES.G1: RemoveGUIPiece(MIRROR120(SQUARES.H1));AddGUIPiece(MIRROR120(SQUARES.F1),PIECES.wR); break;
				case SQUARES.C1: RemoveGUIPiece(MIRROR120(SQUARES.A1));AddGUIPiece(MIRROR120(SQUARES.D1),PIECES.wR); break;
				case SQUARES.G8: RemoveGUIPiece(MIRROR120(SQUARES.H8));AddGUIPiece(MIRROR120(SQUARES.F8),PIECES.bR); break;
				case SQUARES.C8: RemoveGUIPiece(MIRROR120(SQUARES.A8));AddGUIPiece(MIRROR120(SQUARES.D8),PIECES.bR); break;    			
			}  
		} else {
			switch (to) {
				case SQUARES.G1: RemoveGUIPiece(SQUARES.H1);AddGUIPiece(SQUARES.F1,PIECES.wR); break;
				case SQUARES.C1: RemoveGUIPiece(SQUARES.A1);AddGUIPiece(SQUARES.D1,PIECES.wR); break;
				case SQUARES.G8: RemoveGUIPiece(SQUARES.H8);AddGUIPiece(SQUARES.F8,PIECES.bR); break;
				case SQUARES.C8: RemoveGUIPiece(SQUARES.A8);AddGUIPiece(SQUARES.D8,PIECES.bR); break;    			
			}  
		}  	
    }
    var prom = PROMOTED(move);
    //console.log("PromPce:" + prom);
    if(prom != PIECES.EMPTY) {
		//console.log("prom removing from " + PrSq(flippedTo));
    	RemoveGUIPiece(flippedTo);
    	AddGUIPiece(flippedTo,prom);
    }
    
    printGameLine();
}

function DeselectSq(sq) {

	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}
	
	$( ".Square" ).each(function( index ) {     
     if( (RanksBrd[sq] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[sq] == Math.round($(this).position().left/60)) ){     	
     	$(this).removeClass('SqSelected');    
     }
    });
}

function SetSqSelected(sq) {
	
	if(GameController.BoardFlipped == BOOL.TRUE) {
		sq = MIRROR120(sq);
	}
	
	$( ".Square" ).each(function( index ) {    
	//console.log("Looking Sq Selected RanksBrd[sq] " + RanksBrd[sq] + " FilesBrd[sq] " + FilesBrd[sq] + " position " + Math.round($(this).position().left/60) + "," + Math.round($(this).position().top/60));	
     if( (RanksBrd[sq] == 7 - Math.round($(this).position().top/60)) && (FilesBrd[sq] == Math.round($(this).position().left/60)) ){   
		//console.log("Setting Selected Sq");
     	$(this).addClass('SqSelected');    
     }
    });
}

function StartSearch() {
	srch_depth = MAXDEPTH;
	var t = $.now();
	var tt = $('#ThinkTimeChoice').val();
	console.log("time:" + t + " TimeChoice:" + tt);
	srch_time = parseInt(tt) * 1000;
	SearchPosition(); 	
	
	// TODO MakeMove here on internal board and GUI
	MakeMove(srch_best);
	MoveGUIPiece(srch_best);	
	$('#ThinkingPng').remove();
	CheckAndSet();
}

$("#TakeButton").click(function () {	
	console.log('TakeBack request... brd_hisPly:' + brd_hisPly);
	if(brd_hisPly > 0) {
		TakeMove();
		brd_ply = 0;
		SetInitialBoardPieces();
		$("#currentFenSpan").text(BoardToFen());
		//---------------------------------------------------------
//Nytt		
		var ChatText = BoardToFen();
				$.ajax({
					type:'POST',
					url:'../InsertMove.php',
					data:{ChatText:ChatText},
					dataType:'json',
					success:function(data){
						if (data.msg != ""){
							ParseFen(data.msg);
						} else{
							ParseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
						}
					}
				})
				
//---------------------------------------------------------
	}
});

$("#SearchButton").click(function () {	
	GameController.PlayerSide = brd_side^1;
	PreSearch();	
});

$("#FlipButton").click(function () {	
	GameController.BoardFlipped ^= 1;
	//console.log("Flipped:" + GameController.BoardFlipped);
	SetInitialBoardPieces();
});

function NewGame() {
	ParseFen(START_FEN);
	//PrintBoard();		
	SetInitialBoardPieces();
	GameController.PlayerSide = brd_side;
	CheckAndSet();	
	GameController.GameSaved = BOOL.FALSE;
}

$("#NewGameButton").click(function () {	
	NewGame();
	var MoveString = BoardToFen();
		$.ajax({
			type:'POST',
			url:'../InsertMove.php',
			data:{MoveString:MoveString},
			dataType:'json',
			success:function(data){
				//alert(data.msg);
				
			}
		})
});



function initBoardSquares() {

	var light = 0;
	var rankName;
	var fileName;
	var divString;
	var lightString;
	var lastLight=0;
	
	for(rankIter = RANKS.RANK_8; rankIter >= RANKS.RANK_1; rankIter--) {	
		light = lastLight ^ 1;
		lastLight ^= 1;
		rankName = "rank" + (rankIter + 1);			
		for(fileIter = FILES.FILE_A; fileIter <= FILES.FILE_H; fileIter++) {			
		    fileName = "file" + (fileIter + 1); 
		    if(light==0) lightString="Light";
			else lightString="Dark";
			divString = "<div class=\"Square clickElement " + rankName + " " + fileName + " " + lightString + "\"/>";
			//console.log(divString);
			light ^= 1;
			$("#Board").append(divString);
		}
	}	
}

function ClearAllPieces() {
	//console.log("Removing pieces");
	$(".Piece").remove();
}

function SetInitialBoardPieces() {
	var sq;
	var sq120;
	var file,rank;	
	var rankName;
	var fileName;
	var imageString;
	var pieceFileName;
	var pce;
	ClearAllPieces();
	for( sq = 0; sq < 64; ++sq) {
		
		sq120 = SQ120(sq);
		
		pce = brd_pieces[sq120]; // crucial here
		
		if(GameController.BoardFlipped == BOOL.TRUE) {
			sq120 = MIRROR120(sq120);
		}
		
		file = FilesBrd[sq120];
		rank = RanksBrd[sq120];
		
		
		if(pce>=PIECES.wP && pce<=PIECES.bK) {				
			rankName = "rank" + (rank + 1);	
			fileName = "file" + (file + 1);
			
			pieceFileName = "images/" + SideChar[PieceCol[pce]] + PceChar[pce].toUpperCase() + ".png";
			imageString = "<image src=\"" + pieceFileName + "\" class=\"Piece " + rankName + " " + fileName + "\"/>";
			//console.log(imageString);
			$("#Board").append(imageString);
		}
	}

}