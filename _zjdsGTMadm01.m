%zjdsGTMadm01	;
	; --------------------------------------------------------------------
	; GT.M Administration Utility #01 for EWD.js 2015/08/23 13:12
	; #1: GDshowAll    : Global Directory Qualifier show All
	; #2: FreeBlock    : %FREECNT utility displays the number of free blocks
	; #3: DSEWRAP2     : DSE dump, database file header for Bootstrap-Table
	; #4: DSEregion    : Region List
	;
	; Written by Kiyoshi Sawada <casiopea.tpine@gmail.com>
	; Copyright c 2015 Japan DynaSystems Inc.
	; 
	; This program is free software: you can redistribute it and/or modify
	; it under the terms of the GNU Affero General Public License (AGPL)
	; as published by the Free Software Foundation, either version 3 of
	; the License, or (at your option) any later version.
	; 
	; This program is distributed in the hope that it will be useful,
	; but WITHOUT ANY WARRANTY; without even the implied warranty of
	; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	; GNU Affero General Public License for more details.
	;
	; You should have received a copy of the GNU Affero General Public 
	; License along with this program. 
	; If not, see http://www.gnu.org/licenses/.
	q
	; --------------------------------------------------------------------
GDshowAll(pid)	;
	; GT.M Global Directory Qualifier show All for EWD.js 2015/07/26 10:12
	; from ewd.js : ewd.util.invokeWrapperFunction('GDshowAll^%zjdsGTMadm01', ewd);
	; zlink "_zjdsGTMadm01.m" do relink^%zewdGTM
	n inputs,outputs,%zgdequalifier,nDev,error
	n x,y,ver,SIZEOF,TAB,TRUE,TWO
	n update,upper,useio,v30,v44,v532,v533,v534,v542,v550,v5ft1
	n tokens,tfile,tmpacc,sep,star
	n renpref,resume,runtime,s,seghasencrflag
	n nommbi,nullsubs,ok,olabel,rec,reghasv550fields,reghasv600fields
	n gtm64,hdrlab,helpfile,i,in,io,ip,ks,l
	n label,len,log,logfile,lower,mach
	n glo,gdeerr,f,file,filesize,filexfm
	n ZERO,accmeth,am,bs,chset,combase,comlevel,comline,create,dbfilpar
	n defreg,defseg,defdb,defgld,defgldext,defglo
	n debug,encsupportedplat,endian
	n BOL,FALSE,HEX,MAXNAMLN,MAXREGLN,MAXSEGLN
	n ONE,PARNAMLN,PARREGLN,PARSEGLN
	n syntab,nams,minreg,minseg
	n segs,regs,maxreg,maxseg
	n tmpreg,tmpseg
	n iii,j,l1,s1,s2,k,l,m,work,namSharp,wJournal,mj
	n map,mapreg,maps
	;
    s error=""
	i $$set^%LCLCOL(0)
	s (debug,runtime)=0
	s io=$io,useio="io",comlevel=0,combase=$zl,resume(0)=$zl_":INTERACT"
	i $$set^%PATCODE("M")
	d GDEINIT^GDEINIT,GDEMSGIN^GDEMSGIN,GDFIND^GDESETGD
	d CREATE^GDEGET:create,LOAD^GDEGET:'create
	d MAP
	;
	k %zgdequalifier
	s %zgdequalifier=$ZDate($H,"YEAR/MM/DD 24:60:SS")
	k work,wJournal  s k="",l="",m=0,mj=0      ;; Region, Journal
	f  s k=$o(regs(k)) q:k=""  d
	. s work(m,"REGION")=k
	. s l="" f  s l=$o(regs(k,l)) q:l=""  s work(m,l)=$g(regs(k,l))
	. i $g(regs(k,"JOURNAL"))=1 m wJournal(mj)=work(m) s mj=$i(mj)
	. s m=$i(m)
	m %zgdequalifier("Region","data")=work,%zgdequalifier("Journal","data")=wJournal
	k work,wJournal s k="",l="",m=0            ;; Segment
	f  s k=$o(segs(k)) q:k=""  d
	. s work(m,"SEGMENT")=k
	. s l="" f  s l=$o(segs(k,l)) q:l=""  s work(m,l)=$g(segs(k,l))
	. s m=$i(m)
	m %zgdequalifier("Segment","data")=work
	k work s k="",m=0                          ;; MinMaxReg
	f  s k=$o(maxreg(k)) q:k=""  d
	. s work(m,"Region_Item")=k
	. s work(m,"Min")=$g(minreg(k)),work(m,"Max")=$g(maxreg(k))
	. s m=$i(m)
	m %zgdequalifier("MinMaxReg","data")=work
	k work s k="",l="",m=0                     ;; MinMaxSeg
	f  s l=$o(minseg("BG",l)) q:l=""  d
	. s work(m,"Segment_Item")=l
	. s work(m,"Min_BG")=$g(minseg("BG",l)),work(m,"Max_BG")=$g(maxseg("BG",l))
	. s work(m,"Min_MM")=$g(minseg("MM",l)),work(m,"Max_MM")=$g(maxseg("MM",l))
	. s m=$i(m)
	m %zgdequalifier("MinMaxSeg","data")=work
	k work s k="",l="",m=0,namSharp=""         ;; Names
	f  s l=$o(nams(l)) q:l=""  d
	. i l="#" s namSharp=l q
	. s work(m,"GLOBAL")=l,work(m,"REGION")=$g(nams(l)),m=$i(m)
	;s work(m,"GLOBAL")=namSharp,work(m,"REGION")=$g(nams(namSharp))
	m %zgdequalifier("Names","data")=work
	k work s k="",m=0                          ;; Map
	f  s k=$o(maps(k)) q:k=""  m work(m)=maps(k) s m=$i(m)
	m %zgdequalifier("Map","data")=work      ;; maps
	;
	kill ^%zewdTemp(pid,"outputs")
	merge ^%zewdTemp(pid,"outputs")=%zgdequalifier
	QUIT error
	;
MAP	i '$d(mapreg) s mapreg=""
	e  i '$d(regs(mapreg)) zm gdeerr("OBJNOTFND"):"Region":mapreg q
	d SHOWMAKE^GDEMAP
m1	;
	s s1=$o(map("$")),iii=0
	i s1'="%" s map("%")=map("$"),s1="%"
	f  s s2=s1,s1=$o(map(s2)) q:'$l(s1)  d onemap(s1,s2)
	d onemap("...",s2)
	i $d(nams("#")) s s2="LOCAL LOCKS",map(s2)=nams("#") d onemap("",s2) k map(s2)
	q
onemap:(s1,s2)	;
	s iii=$i(iii)
	i $l(mapreg),mapreg'=map(s2) q
	s l1=$l(s1)
	i $l(s2)=l1,$e(s1,l1)=0,$e(s2,l1)=")",$e(s1,1,l1-1)=$e(s2,1,l1-1) q
	s maps(iii,"From")=$tr(s2,")","0")
	s maps(iii,"UpTo")=$tr(s1,")","0")
	s maps(iii,"Region")=map(s2)
	;
	i '$d(regs(map(s2),"DYNAMIC_SEGMENT")) d  q
	. s maps(iii,"Segment")="NONE"
	. s maps(iii,"File")="NONE"
	s j=regs(map(s2),"DYNAMIC_SEGMENT")
	s maps(iii,"Segment")=j
	i '$d(segs(j,"ACCESS_METHOD")) s s="NONE"
	e  s s=segs(j,"FILE_NAME")
	s maps(iii,"File")=s
	q
	;--------------------------------------------------------------------
FreeBlock(pid)	;
	; %FREECNT utility displays the number of free blocks
	; from ewd.js : ewd.util.invokeWrapperFunction('FreeBlock^%zjdsGTMadm01', ewd);
	n i,result,rn,fb,tb,inputs,outputs,error
	s error=""
	merge inputs=^%zewdTemp(pid,"inputs")
	s rn=""
	f i=0:1 s rn=$view("gvnext",rn) q:rn=""  d
	. s result(i,"Region")=rn
	. s (fb,result(i,"Free"))=$v("FREEBLOCKS",rn)
	. s (tb,result(i,"Total"))=$v("TOTALBLOCKS",rn)
	. s result(i,"Percentage")=$fn(fb/tb*100.0,"",2)  ;; w $FNumber(x,"",2) $j(fb/tb*100.0,6,2)
	. s result(i,"Database_file")=$v("GVFILE",rn)
	kill ^%zewdTemp(pid,"outputs","FreeBlock")
	merge ^%zewdTemp(pid,"outputs","FreeBlock","data")=result
	QUIT error
	;--------------------------------------------------------------------
DSEWRAP(pid)	;
	; DSE dump, database file header to ewd.js Array object
	; from ewd.js : ewd.util.invokeWrapperFunction('DSEWRAP^%zjdsGTMadm01', ewd);
	; output JSON ex.
	;  [{"DEFAULT":0,"FIELD_NAME":"Abandoned Kills","TEMP":0}, .... ]
	n dse,reg,fn,fn2,data,i,field,result,inputs,outputs,error
	merge inputs=^%zewdTemp(pid,"inputs")
	s error=""
	;
	d dump^%DSEWRAP("*",.dse,"","all")
	s reg=""
	f  s reg=$o(dse(reg)) q:reg=""  d
	. s fn=""
	. f  s fn=$o(dse(reg,fn)) q:fn=""  d
	. . s field(fn)=""
	. . s fn2=""
	. . f  s fn2=$o(dse(reg,fn,fn2)) q:fn2=""  d
	. . . s field(fn,fn2)=""
	. . . s fn3=""
	. . . f  s fn3=$o(dse(reg,fn,fn2,fn3)) q:fn3=""  d
	. . . . s field(fn,fn2,fn3)=""
	;
	s fn=""
	f i=1:1 s fn=$o(field(fn)) q:fn=""  d
	. ;;;s result(i,"FIELD_NAME")=fn
	. s reg=""
	. f  s reg=$o(dse(reg)) q:reg=""  d
	. . s result(i,fn,reg)=$g(dse(reg,fn))
	. s fn2=""
	. f  s fn2=$o(field(fn,fn2)) q:fn2=""  d
	. . s i=$i(i)
	. . s reg=""
	. . f  s reg=$o(dse(reg)) q:reg=""  d
	. . . s result(i,fn_"_"_fn2,reg)=$g(dse(reg,fn,fn2))
	. . s fn3=""
	. . f  s fn3=$o(field(fn,fn2,fn3)) q:fn3=""  d
	. . . s i=$i(i)
	. . . s reg=""
	. . . f  s reg=$o(dse(reg)) q:reg=""  d
	. . . . s result(i,fn_"_"_fn2_"_"_fn3,reg)=$g(dse(reg,fn,fn2,fn3))
	;
	kill ^%zewdTemp(pid,"outputs","DseWrap")
	merge ^%zewdTemp(pid,"outputs","DseWrap")=result
	QUIT error
	; Note : not $ETRAP handler
	;--------------------------------------------------------------------
DSEWRAP2(pid)	;
	; DSE dump, database file header to ewd.js Array object for Bootstrap-Table
	; from ewd.js : ewd.util.invokeWrapperFunction('DSEWRAP^%zjdsGTMadm01', ewd);
	; output JSON ex.
	;  [{"DEFAULT":0,"FIELD_NAME":"Abandoned Kills","TEMP":0}, .... ]
	n dse,reg,fn,fn2,data,i,field,result,inputs,outputs,error
	n columns,cout
	merge inputs=^%zewdTemp(pid,"inputs")
	s error=""
	;
	s count=0
	s columns(count,"field")="FIELD_NAME"
	s columns(count,"title")="FIELD_NAME"
	d dump^%DSEWRAP("*",.dse,"","all")
	s reg=""
	f  s reg=$o(dse(reg)) q:reg=""  d
	. s count=$i(count)
	. s columns(count,"field")=reg
	. s columns(count,"title")=reg
	. s fn=""
	. f  s fn=$o(dse(reg,fn)) q:fn=""  d
	. . s field(fn)=""
	. . s fn2=""
	. . f  s fn2=$o(dse(reg,fn,fn2)) q:fn2=""  d
	. . . s field(fn,fn2)=""
	. . . s fn3=""
	. . . f  s fn3=$o(dse(reg,fn,fn2,fn3)) q:fn3=""  d
	. . . . s field(fn,fn2,fn3)=""
	;
	s fn=""
	f i=0:1 s fn=$o(field(fn)) q:fn=""  d
	. s reg=""
	. f  s reg=$o(dse(reg)) q:reg=""  d
	. . s data(i,"FIELD_NAME")=fn
	. . s data(i,reg)=$g(dse(reg,fn))
	. s fn2=""
	. f  s fn2=$o(field(fn,fn2)) q:fn2=""  d
	. . s i=$i(i)
	. . s reg=""
	. . f  s reg=$o(dse(reg)) q:reg=""  d
	. . . s data(i,"FIELD_NAME")=fn_"_"_fn2
	. . . s data(i,reg)=$g(dse(reg,fn,fn2))
	. . s fn3=""
	. . f  s fn3=$o(field(fn,fn2,fn3)) q:fn3=""  d
	. . . s i=$i(i)
	. . . s reg=""
	. . . f  s reg=$o(dse(reg)) q:reg=""  d
	. . . . s data(i,"FIELD_NAME")=fn_"_"_fn2_"_"_fn3
	. . . . s data(i,reg)=$g(dse(reg,fn,fn2,fn3))
	;
	kill ^%zewdTemp(pid,"outputs","DseWrap")
	merge ^%zewdTemp(pid,"outputs","DseWrap","columns")=columns
	merge ^%zewdTemp(pid,"outputs","DseWrap","data")=data
	QUIT error
	;--------------------------------------------------------------------
DSEregion(pid)	;
	; w $$DSEregion^%nodemGTM(pid)
	; Region List
	; Useing $VIEW("GVNEXT")
	; output JSON ex.   ["DEFAULT","TEMP"]
	n GV,inputs,outputs,error
	s error=""
	merge inputs=^%zewdTemp(pid,"inputs")
	s GV="" f i=0:1 s GV=$VIEW("GVNEXT",GV) q:GV=""  s GV(i)=GV
	kill ^%zewdTemp(pid,"outputs","DSEregion")
	merge ^%zewdTemp(pid,"outputs","DSEregion")=GV
	QUIT error
	;--------------------------------------------------------------------
GSELlist(pid) ;
	; IN  : mupip Extract SELECT qualifier list
	; OUT : Global List
	; inner Module : %ZG -> Do CALL^%GSEL 
	; zlink "_zjdsGTMadm01.m" do relink^%zewdGTM
	n inputs,error,n,k,gName,glb,outputs,i
	merge inputs=^%zewdTemp(pid,"inputs","GSEL")
	s error=""
	;
	s n="",gName=""
	f  s n=$o(inputs(n)) q:n=""  d
	. s gName=$g(inputs(n))
	. i gName?.N quit
	. i gName[":",$p(gName,":",2)?.N quit
	. k %ZG
	. s %ZG=gName
	. d CALL^%GSEL
	. i %ZG d
	. . s k="" f  s k=$o(%ZG(k)) q:k=""  s glb(k)=""
	. k %ZG
	s k="" f i=0:1 s k=$o(glb(k)) q:k=""  s outputs(i)=k
	;
	kill ^%zewdTemp(pid,"outputs","GSEL")
	merge ^%zewdTemp(pid,"outputs","GSEL")=outputs
	QUIT error
	;--------------------------------------------------------------------
Test6	;
	n pid,sucess
	s pid=999999999
	s sucess=$$DSEWRAP2(pid)
	zwr ^%zewdTemp(pid,"outputs","DseWrap",:,:,:,:,:,:,:,:)
	QUIT
Test5	;
	n pid,sucess
	s pid=999999999
	s sucess=$$DSEWRAP(pid)
	zwr ^%zewdTemp(pid,"outputs","DseWrap",:,:,:,:,:,:,:,:)
	QUIT
Test4	;
	n pid,sucess
	s pid=999999999
	s sucess=$$DSEregion(pid)
	zwr ^%zewdTemp(pid,"outputs","DSEregion",:,:,:,:,:,:,:,:)
	QUIT
Test3	;
	n pid,sucess
	s pid=999999999
	s sucess=$$FreeBlock(pid)
	zwr
	zwr ^%zewdTemp(pid,"outputs","FreeBlock",:,:,:,:,:,:,:,:)
	QUIT
Test2	;
	n pid,sucess
	s pid=999999999
	k ^%zewdTemp(pid)
	s ^%zewdTemp(pid,"inputs")=""
	w "Job Call finish :"
	d GDshowAll^%zjdsGTMadm01(pid)
	;w "Status GDshowAll : ",$s(sucess="":"Sucsess!",1:"error!"),!
	;w "Result GDshowAll = ",!
	;zwr ^%zewdTemp(pid,"outputs",:,:,:,:,:,:)
	k ^%zewdTemp(pid)
	QUIT
Test1	;
	n pid,sucess
	s pid=999999999
	k ^%zewdTemp(pid)
	s ^%zewdTemp(pid,"inputs")=""
	;w "Status GDshowAll : ",$s($$GDshowAll(pid)="":"Sucsess!",1:"error!"),!
	d GDshowAll^%zjdsGTMadm01(pid)
	w "Result GDshowAll = ",!,!
	zwr ^%zewdTemp(pid,"outputs",:,:,:,:,:,:)
	k ^%zewdTemp(pid)
	QUIT
	;--------------------------------------------------------------------


